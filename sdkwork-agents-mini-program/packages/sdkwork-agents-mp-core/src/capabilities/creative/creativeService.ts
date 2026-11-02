import {
  type SdkworkAgentsAppClient,
  type SdkworkAgentsMpDriveAppClient,
} from "../../sdk";

import {
  type AgentsMpCreativeAspect,
  type AgentsMpCreativeCatalog,
  type AgentsMpCreativeMedia,
  type AgentsMpCreativeMediaKind,
  type AgentsMpCreativeModality,
  type AgentsMpCreativeRun,
  type AgentsMpCreativeRunStore,
  type AgentsMpCreativeRunStatus,
  type AgentsMpCreativeTool,
} from "./creativeModels";

/**
 * Creative studio orchestration over the media tool transport.
 *
 * The directory (`/ai/tools`) is the authoritative list of generation tools this
 * tenant can invoke: the service keeps only entries that are enabled, configured
 * and prompt-capable, and it reads each tool's `inputSchema` to decide which
 * arguments are declared before sending any. The SDK client is injected by the
 * compose root (`MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md` section 4).
 */

/** Requested aspect to the provider size vocabulary declared by image/video tools. */
export const AGENTS_MP_CREATIVE_ASPECT_SIZES: Record<AgentsMpCreativeAspect, string> = {
  square: "1024x1024",
  landscape: "1536x1024",
  portrait: "1024x1536",
};

/** Device-local run log ceiling; the studio is a working surface, not an archive. */
export const AGENTS_MP_CREATIVE_MAX_RUNS = 20;

/** Renderable media results kept per run. */
const MAX_MEDIA_PER_RUN = 24;
/** Recursion bound for walking an arbitrary tool output object. */
const MAX_OUTPUT_DEPTH = 4;
/** Download-URL lifetime requested from Drive for a persisted asset. */
const DRIVE_URL_TTL_SECONDS = 900;

const SUCCEEDED_STATUSES = new Set(["succeeded", "success", "completed", "ok", "done", "finished"]);
const PENDING_STATUSES = new Set([
  "pending",
  "queued",
  "running",
  "processing",
  "submitted",
  "accepted",
  "in_progress",
]);

/** Raw directory entry shape; the transport DTO is generator-owned. */
interface AgentsMpRawMediaToolEntry {
  readonly toolId?: string;
  readonly category?: string;
  readonly name?: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly inputSchema?: Record<string, unknown> | null;
  readonly enabled?: boolean;
  readonly configured?: boolean;
  readonly saveToDriveDefault?: boolean;
}

interface AgentsMpRawInvokeResponse {
  readonly toolCallId?: string;
  readonly status?: string;
  readonly output?: unknown;
  readonly error?: string | null;
  readonly driveAsset?: {
    readonly spaceId?: string;
    readonly nodeId?: string;
    readonly driveUri?: string;
  } | null;
}

function resolveModality(entry: AgentsMpRawMediaToolEntry): AgentsMpCreativeModality | null {
  const category = (entry.category ?? "").trim().toLowerCase();
  if (category === "image") return "image";
  if (category === "video") return "video";
  if (category === "music") return "music";
  const toolId = (entry.toolId ?? "").trim().toLowerCase();
  if (toolId.startsWith("image.")) return "image";
  if (toolId.startsWith("video.")) return "video";
  if (toolId.startsWith("music.")) return "music";
  return null;
}

function readSchemaProperties(schema: Record<string, unknown> | null | undefined): Set<string> {
  if (!schema) {
    return new Set();
  }
  const properties = schema.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    return new Set();
  }
  return new Set(Object.keys(properties as Record<string, unknown>));
}

function isPromptCapable(schema: Record<string, unknown> | null | undefined): boolean {
  if (!schema) {
    return false;
  }
  return readSchemaProperties(schema).has("prompt");
}

/** Maps one directory entry onto the studio's tool descriptor, or `null` when unusable. */
export function mapAgentsMpCreativeTool(
  entry: AgentsMpRawMediaToolEntry,
): AgentsMpCreativeTool | null {
  const id = typeof entry.toolId === "string" ? entry.toolId : "";
  if (id.length === 0) {
    return null;
  }
  if (entry.enabled !== true || entry.configured === false) {
    return null;
  }
  const modality = resolveModality(entry);
  if (!modality || !isPromptCapable(entry.inputSchema)) {
    return null;
  }
  const properties = readSchemaProperties(entry.inputSchema);
  const label = entry.displayName?.trim() || entry.name?.trim() || id;
  return {
    id,
    modality,
    label,
    ...(entry.description ? { description: entry.description } : {}),
    supportsSize: properties.has("size"),
    saveToDriveDefault: entry.saveToDriveDefault === true,
  };
}

function toMediaKind(kind: string | undefined, modality: AgentsMpCreativeModality): AgentsMpCreativeMediaKind {
  const normalized = (kind ?? "").trim().toLowerCase();
  if (normalized === "image" || normalized === "video" || normalized === "audio") {
    return normalized;
  }
  return modality === "image" ? "image" : modality === "video" ? "video" : "audio";
}

/**
 * Collects renderable media URLs from an arbitrary tool output.
 *
 * Media tools return category-specific envelopes (`images`, `videos`,
 * `audios`, `items`, ...) whose members share a `url` property, so the walker
 * keys on `url` instead of hard-coding one envelope per category.
 */
export function collectAgentsMpCreativeMedia(
  output: unknown,
  modality: AgentsMpCreativeModality,
  collected: AgentsMpCreativeMedia[] = [],
  depth = 0,
): AgentsMpCreativeMedia[] {
  if (depth > MAX_OUTPUT_DEPTH || collected.length >= MAX_MEDIA_PER_RUN) {
    return collected;
  }
  if (Array.isArray(output)) {
    for (const entry of output) {
      collectAgentsMpCreativeMedia(entry, modality, collected, depth + 1);
      if (collected.length >= MAX_MEDIA_PER_RUN) break;
    }
    return collected;
  }
  if (!output || typeof output !== "object") {
    return collected;
  }
  const record = output as Record<string, unknown>;
  const url = typeof record.url === "string" ? record.url : undefined;
  if (url && /^https?:\/\//iu.test(url)) {
    collected.push({
      kind: toMediaKind(typeof record.kind === "string" ? record.kind : undefined, modality),
      url,
    });
    return collected;
  }
  for (const value of Object.values(record)) {
    if (collected.length >= MAX_MEDIA_PER_RUN) break;
    collectAgentsMpCreativeMedia(value, modality, collected, depth + 1);
  }
  return collected;
}

/** Reads the run status from the invoke response and the extracted media. */
export function resolveAgentsMpCreativeRunStatus(
  status: string | undefined,
  hasMedia: boolean,
  error: string | undefined,
): AgentsMpCreativeRunStatus {
  if (error) {
    return "failed";
  }
  const normalized = (status ?? "").trim().toLowerCase();
  if (SUCCEEDED_STATUSES.has(normalized)) {
    return hasMedia ? "succeeded" : "pending";
  }
  if (PENDING_STATUSES.has(normalized)) {
    return "pending";
  }
  return hasMedia ? "succeeded" : "failed";
}

export interface AgentsMpCreativeGenerateInput {
  readonly tool: AgentsMpCreativeTool;
  readonly prompt: string;
  readonly aspect: AgentsMpCreativeAspect;
}

export interface AgentsMpCreativeService {
  loadCatalog(): Promise<AgentsMpCreativeCatalog>;
  generate(input: AgentsMpCreativeGenerateInput): Promise<AgentsMpCreativeRun>;
  listRuns(): AgentsMpCreativeRun[];
  clearRuns(): void;
}

export function createAgentsMpCreativeService(
  client: SdkworkAgentsAppClient,
  store: AgentsMpCreativeRunStore,
  driveClient?: SdkworkAgentsMpDriveAppClient,
): AgentsMpCreativeService {
  const readRuns = (): AgentsMpCreativeRun[] => {
    try {
      const runs = store.read();
      return Array.isArray(runs) ? runs : [];
    } catch {
      return [];
    }
  };

  const writeRuns = (runs: readonly AgentsMpCreativeRun[]): void => {
    try {
      store.write(runs.slice(0, AGENTS_MP_CREATIVE_MAX_RUNS));
    } catch {
      // A full or unavailable device store must not fail a completed request.
    }
  };

  const resolveDrivePreviewUrl = async (nodeId: string): Promise<string | undefined> => {
    if (!driveClient) {
      return undefined;
    }
    try {
      const response = await driveClient.drive.nodes.downloadUrls.retrieve(nodeId, {
        requestedTtlSeconds: DRIVE_URL_TTL_SECONDS,
      });
      const url = (response as { downloadUrl?: unknown }).downloadUrl;
      return typeof url === "string" && url.length > 0 ? url : undefined;
    } catch {
      return undefined;
    }
  };

  return {
    async loadCatalog() {
      const entries = (await client.ai.agents.tools.list()) as AgentsMpRawMediaToolEntry[];
      const tools = entries
        .map(mapAgentsMpCreativeTool)
        .filter((tool): tool is AgentsMpCreativeTool => tool !== null);
      return tools.length === 0
        ? { availability: "unavailable", tools, reason: "no-generation-tool" }
        : { availability: "available", tools };
    },

    async generate({ tool, prompt, aspect }) {
      const text = prompt.trim();
      if (text.length === 0) {
        throw new Error("A prompt is required to generate content.");
      }
      const response = (await client.ai.agents.tools.invoke(tool.id, {
        arguments: {
          prompt: text,
          ...(tool.supportsSize ? { size: AGENTS_MP_CREATIVE_ASPECT_SIZES[aspect] } : {}),
        },
        saveToDrive: true,
      })) as AgentsMpRawInvokeResponse;

      const media = collectAgentsMpCreativeMedia(response.output, tool.modality);
      const nodeId = response.driveAsset?.nodeId;
      if (nodeId) {
        const driveUrl = await resolveDrivePreviewUrl(nodeId);
        if (driveUrl) {
          media.unshift({ kind: toMediaKind(undefined, tool.modality), url: driveUrl });
        }
      }

      const error = typeof response.error === "string" && response.error.trim().length > 0
        ? response.error.trim()
        : undefined;
      const status = resolveAgentsMpCreativeRunStatus(response.status, media.length > 0, error);
      const run: AgentsMpCreativeRun = {
        id: response.toolCallId?.trim() || `${tool.id}:${Date.now()}`,
        toolCallId: response.toolCallId?.trim() || "",
        toolId: tool.id,
        modality: tool.modality,
        prompt: text,
        aspect,
        status,
        createdAt: new Date().toISOString(),
        media: media.slice(0, MAX_MEDIA_PER_RUN),
        ...(error ? { error } : {}),
      };
      writeRuns([run, ...readRuns()]);
      return run;
    },

    listRuns() {
      return readRuns();
    },

    clearRuns() {
      writeRuns([]);
    },
  };
}
