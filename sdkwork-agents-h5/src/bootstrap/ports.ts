/**
 * Composition-root port wiring.
 *
 * Client capability packages `MUST NOT` construct or import generated SDK
 * clients; they declare ports and the application root injects the SDK-backed
 * implementations (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 1, 5 and
 * 8). This module is the single place that bridges the two, so swapping a
 * transport (standalone session storage, a host-injected client such as
 * sdkwork-im-h5, or a future mini program runtime) only touches this file.
 */

import {
  agentChatService,
  agentService,
  loadMobileModelCatalog,
  type AgentConfig,
  type AgentTurnWireProtocol,
  type ChatMessage,
  type ChatSessionSummary,
} from "@sdkwork/agents-h5-agents";
import {
  configureAssetsPort,
  type AssetItem,
  type AssetsPort,
} from "@sdkwork/agents-h5-assets";
import {
  configureCanvasPort,
  type CanvasConnection,
  type CanvasGroup,
  type CanvasNode,
  type CanvasNodeStatus,
  type CanvasNodeType,
  type CanvasPort,
  type CanvasWorkflow,
} from "@sdkwork/agents-h5-canvas";
import {
  DEFAULT_CONVERSATION_AGENT_ID,
  configureConversationPort,
  type ConversationMessage,
  type ConversationPort,
  type ConversationSession,
} from "@sdkwork/agents-h5-conversation";
import {
  configureCreativePort,
  type CreativeAspect,
  type CreativeMedia,
  type CreativeModality,
  type CreativePort,
  type CreativeTool,
} from "@sdkwork/agents-h5-creative";
import {
  configureInspirationPort,
  type InspirationItem,
  type InspirationPort,
} from "@sdkwork/agents-h5-inspiration";
import { configureLibraryPort, type LibraryPort } from "@sdkwork/agents-h5-library";
import {
  MembershipService,
  configureMembershipPort,
  type MembershipPlan,
  type MembershipPort,
  type MembershipSummary,
} from "@sdkwork/agents-h5-membership";
import { configureProfilePort, type ProfilePort } from "@sdkwork/agents-h5-profile";
import { configureProjectsPort, type ProjectsPort } from "@sdkwork/agents-h5-projects";
import { configureSettingsPort } from "@sdkwork/agents-h5-settings";
import { getAgentsShellLocale } from "@sdkwork/agents-h5-shell";
import { configureAutomationPort, type AutomationPort } from "@sdkwork/agents-h5-automation";
import {
  getAgentsAppSdkClientWithSession,
  getDriveAppSdkClientWithSession,
  getFeedsOpenSdkClient,
  getMembershipAppSdkClientWithSession,
  getAgentsMembershipCheckoutService,
  getUsageSummary,
  CHAT_FILE_LIBRARY_PROPERTY_KEY,
  type AgentProjectRecord,
  type AgentTaskRecord,
  type FeedItem,
} from "@sdkwork/agents-h5-core/sdk";
import { toOffsetPageInfo } from "@sdkwork/agents-h5-core/sdk/pagination";
import {
  clearAppSdkSessionTokens,
  createSdkworkChatRequestContext,
  isAppSdkSessionAuthenticated,
} from "@sdkwork/agents-h5-core/session";

import { resolveEnvironment } from "./environment";
import { setAgentsH5LocalePreference } from "./i18n";
import { resolveAgentsH5ThemeMode, setAgentsH5ThemePreference } from "./theme";

/** Bounded fan-out for the automation tab (agent list page size). */
const AUTOMATION_AGENT_FANOUT = 10;
/** Bounded per-agent task page size for the automation tab. */
const AUTOMATION_AGENT_TASK_PAGE_SIZE = 20;
/** Memo TTL for the aggregated automation listing. */
const AUTOMATION_CACHE_TTL_MS = 30_000;

const AGENT_TURN_WIRE_PROTOCOLS = new Set<AgentTurnWireProtocol>([
  "chat_completions",
  "anthropic_messages",
  "google_content",
  "openai_responses",
]);

/** Narrows an untyped wire-protocol hint onto the generated request union. */
function toWireProtocol(value?: string): AgentTurnWireProtocol | undefined {
  return value && AGENT_TURN_WIRE_PROTOCOLS.has(value as AgentTurnWireProtocol)
    ? (value as AgentTurnWireProtocol)
    : undefined;
}

function toConversationMessage(message: ChatMessage): ConversationMessage {
  return {
    id: message.id,
    role: message.role,
    text: message.content,
    ...(message.createdAt ? { createdAt: message.createdAt } : {}),
    ...(message.reasoning ? { reasoning: message.reasoning } : {}),
    ...(message.toolCalls?.length ? { toolCalls: message.toolCalls } : {}),
  };
}

function toConversationSession(summary: ChatSessionSummary): ConversationSession {
  const parsed = Date.parse(summary.updatedAt);
  return {
    id: summary.id,
    title: summary.title,
    // The conversation surface sorts by epoch milliseconds (locale-independent),
    // while the wire record carries an ISO timestamp.
    updatedAt: Number.isFinite(parsed) ? parsed : Date.now(),
    version: summary.version,
  };
}

function toAgentRecord(agent: AgentConfig | null): {
  id: string;
  name?: string;
  model?: string;
  systemPrompt?: string;
  welcomeMessage?: string;
} | null {
  if (!agent?.id) {
    return null;
  }
  return {
    id: agent.id,
    ...(agent.name ? { name: agent.name } : {}),
    ...(agent.model ? { model: agent.model } : {}),
    ...(agent.systemPrompt ? { systemPrompt: agent.systemPrompt } : {}),
    ...(agent.welcomeMessage ? { welcomeMessage: agent.welcomeMessage } : {}),
  };
}

/** The library property may not be provisioned for a caller yet; treat 404 as empty. */
function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as Record<string, unknown>;
  const status = record.status ?? record.statusCode ?? record.httpStatus;
  if (status === 404 || status === "404") {
    return true;
  }
  if (record.code === "NOT_FOUND" || record.code === 40401) {
    return true;
  }
  const problem = record.problem;
  if (problem && typeof problem === "object") {
    const detail = problem as Record<string, unknown>;
    if (detail.status === 404 || detail.status === "404" || detail.code === 40401) {
      return true;
    }
  }
  return false;
}

function toProjectSummary(record: AgentProjectRecord) {
  return {
    id: record.projectId,
    name: record.name,
    ...(record.description ? { description: record.description } : {}),
    ...(record.status ? { status: String(record.status) } : {}),
    ...(record.updatedAt ? { updatedAt: record.updatedAt } : {}),
  };
}

function describeSchedule(record: AgentTaskRecord): string | undefined {
  if (record.scheduleKind === "cron" && record.cronExpression) {
    return record.cronExpression;
  }
  if (record.scheduledAt) {
    return record.scheduledAt;
  }
  return undefined;
}

function toTaskSummary(record: AgentTaskRecord) {
  const schedule = describeSchedule(record);
  return {
    id: record.taskId,
    name: record.title ?? record.prompt.slice(0, 60),
    status: record.status,
    ...(schedule ? { schedule } : {}),
    ...(record.updatedAt ? { updatedAt: record.updatedAt } : {}),
  };
}

let automationCache: { expiresAt: number; tasks: ReturnType<typeof toTaskSummary>[] } | null = null;

/**
 * The Agents app API scopes scheduled tasks to one managed agent, so the
 * automation tab aggregates the caller's own agents with a bounded fan-out and
 * memoizes the result for the tab's lifetime.
 */
async function collectAutomationTasks(): Promise<ReturnType<typeof toTaskSummary>[]> {
  const now = Date.now();
  if (automationCache && automationCache.expiresAt > now) {
    return automationCache.tasks;
  }

  const client = getAgentsAppSdkClientWithSession();
  const agents = await agentService.listAgentsPage({
    page: 1,
    pageSize: AUTOMATION_AGENT_FANOUT,
    scope: "mine",
  });
  const agentIds = agents.items
    .map((agent) => agent.id)
    .filter((id): id is string => Boolean(id));

  const settled = await Promise.allSettled(
    agentIds.map(async (agentId) => {
      const response = await client.ai.agents.tasks.list(agentId, {
        pageSize: AUTOMATION_AGENT_TASK_PAGE_SIZE,
      });
      return (response.items as AgentTaskRecord[]).map(toTaskSummary);
    }),
  );

  const failures = settled.filter((entry) => entry.status === "rejected");
  if (agentIds.length > 0 && failures.length === settled.length) {
    // Every agent failed: surface the first reason instead of an empty tab.
    throw (failures[0] as PromiseRejectedResult).reason;
  }

  const tasks = settled.flatMap((entry) =>
    entry.status === "fulfilled" ? entry.value : [],
  );
  tasks.sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""));
  automationCache = { expiresAt: now + AUTOMATION_CACHE_TTL_MS, tasks };
  return tasks;
}

/** Test-only reset for the memoized automation aggregation. */
export function resetAutomationCache(): void {
  automationCache = null;
}

function createConversationPort(): ConversationPort {
  return {
    async getAgent(agentId) {
      return toAgentRecord(await agentService.getAgent(agentId));
    },

    async createAgent(draft) {
      const created = await agentService.createAgent({
        id: draft.id,
        name: draft.name,
        description: draft.description,
        type: draft.type,
        model: draft.model,
        systemPrompt: draft.systemPrompt,
        welcomeMessage: draft.welcomeMessage,
      });
      return toAgentRecord(created) ?? { id: draft.id, name: draft.name };
    },

    async updateAgentModel(agentId, model) {
      await agentService.updateAgent(agentId, { model });
    },

    async resolveDefaultModel() {
      const catalog = await loadMobileModelCatalog();
      const preferred = catalog.find((item) => item.defaultForEngine) ?? catalog[0];
      if (!preferred) {
        throw new Error("Agent engine runtime catalog is unavailable.");
      }
      return preferred.id;
    },

    async listSessions(agentId) {
      const sessions = await agentChatService.listSessionSummaries(agentId);
      return sessions.map(toConversationSession);
    },

    async createSession(agentId, title) {
      return toConversationSession(await agentChatService.createSessionSummary(agentId, title));
    },

    async renameSession(agentId, sessionId, title) {
      await agentChatService.updateSession(agentId, sessionId, { title });
    },

    async deleteSession(agentId, sessionId) {
      await agentChatService.deleteSession(agentId, sessionId);
    },

    async listMessagesPage(agentId, sessionId, cursor) {
      // Newest-first window plus a backward cursor: the transcript loads one
      // bounded page and pages toward older items on scroll (PAGINATION_SPEC §8).
      const page = await agentChatService.listRecentMessagesPage(agentId, sessionId, cursor);
      return {
        items: page.items.map(toConversationMessage),
        hasMore: page.pageInfo.hasMore,
        ...(page.pageInfo.nextCursor ? { nextCursor: page.pageInfo.nextCursor } : {}),
      };
    },

    async sendTurn(request) {
      const message = await agentChatService.sendMessage(
        request.agentId,
        request.sessionId,
        request.content,
        request.model,
        request.systemPrompt,
        toWireProtocol(request.wireProtocol),
      );
      return { id: message.id, content: message.content };
    },

    async streamTurn(request, handlers) {
      const message = await agentChatService.sendMessageStream(
        request.agentId,
        request.sessionId,
        request.content,
        request.model,
        (delta) => handlers.onDelta?.(delta),
        request.systemPrompt,
        handlers.onReasoning ? (reasoning) => handlers.onReasoning?.(reasoning) : undefined,
        handlers.onToolEvent ? (event) => handlers.onToolEvent?.(event) : undefined,
        toWireProtocol(request.wireProtocol),
      );
      return { id: message.id, content: message.content };
    },

    readPermissionScope() {
      return createSdkworkChatRequestContext()?.permissionScope ?? [];
    },
  };
}

function createLibraryPort(): LibraryPort {
  return {
    async listFiles(pageSize, cursor) {
      try {
        const result = await getDriveAppSdkClientWithSession().drive.propertyNodes.list(
          CHAT_FILE_LIBRARY_PROPERTY_KEY,
          { pageSize: String(pageSize), ...(cursor ? { cursor } : {}) },
        );
        return {
          items: result.items.map((node) => ({
            id: node.id,
            name: node.nodeName,
            ...(node.contentType ? { mimeType: node.contentType } : {}),
            ...(node.contentLength ? { sizeBytes: node.contentLength } : {}),
            ...(node.updatedAt ? { updatedAt: node.updatedAt } : {}),
            ...(node.spaceId ? { spaceId: node.spaceId } : {}),
          })),
          nextCursor: result.pageInfo.nextCursor ?? null,
        };
      } catch (error) {
        if (isNotFoundError(error)) {
          return { items: [], nextCursor: null };
        }
        throw error;
      }
    },

    async resolvePreviewUrl(nodeId) {
      const response = await getDriveAppSdkClientWithSession().drive.nodes.downloadUrls.retrieve(
        nodeId,
        { requestedTtlSeconds: 900 },
      );
      return response.downloadUrl;
    },
  };
}

function createProjectsPort(): ProjectsPort {
  return {
    async listProjects(page, pageSize) {
      const response = await getAgentsAppSdkClientWithSession().ai.agents.projects.list({
        page,
        pageSize,
      });
      const pageInfo = toOffsetPageInfo(response.pageInfo);
      return {
        items: (response.items as AgentProjectRecord[]).map(toProjectSummary),
        page: pageInfo.page,
        hasMore: pageInfo.hasMore,
      };
    },
  };
}

function createAutomationPort(): AutomationPort {
  return {
    async listTasks(page, pageSize) {
      const tasks = await collectAutomationTasks();
      const start = (page - 1) * pageSize;
      return {
        items: tasks.slice(start, start + pageSize),
        page,
        hasMore: start + pageSize < tasks.length,
      };
    },
  };
}

/** View-URL lifetime requested from Drive, in seconds. */
const ASSET_URL_TTL_SECONDS = 900;
/** Concurrent preview resolutions; the asset list can be long. */
const ASSET_RESOLVE_CONCURRENCY = 6;
/** Recursion bound for walking an arbitrary media-tool output object. */
const CREATIVE_OUTPUT_MAX_DEPTH = 4;
/** Renderable media kept per creative run. */
const CREATIVE_MAX_MEDIA = 24;

const CREATIVE_ASPECT_SIZES: Record<CreativeAspect, string> = {
  square: "1024x1024",
  landscape: "1536x1024",
  portrait: "1024x1536",
};

const CREATIVE_SUCCEEDED_STATUSES = new Set([
  "succeeded",
  "success",
  "completed",
  "ok",
  "done",
  "finished",
]);
const CREATIVE_PENDING_STATUSES = new Set([
  "pending",
  "queued",
  "running",
  "processing",
  "submitted",
  "accepted",
  "in_progress",
]);

async function resolveDrivePreviewUrl(nodeId: string): Promise<string | undefined> {
  try {
    const response = await getDriveAppSdkClientWithSession().drive.nodes.downloadUrls.retrieve(
      nodeId,
      { requestedTtlSeconds: ASSET_URL_TTL_SECONDS },
    );
    return typeof response.downloadUrl === "string" && response.downloadUrl.length > 0
      ? response.downloadUrl
      : undefined;
  } catch {
    return undefined;
  }
}

function createAssetsPort(): AssetsPort {
  return {
    async listAssets() {
      const client = getAgentsAppSdkClientWithSession();
      const records = await client.ai.agents.assets.list();
      const items: AssetItem[] = [];
      for (const record of records) {
        const nodeId = typeof record.driveNodeId === "string" ? record.driveNodeId : "";
        if (nodeId.length === 0) {
          continue;
        }
        const mediaKind = typeof record.mediaKind === "string" ? record.mediaKind : "";
        const sourceUrl =
          typeof record.sourceUrl === "string" && record.sourceUrl.length > 0
            ? record.sourceUrl
            : undefined;
        items.push({
          id: nodeId,
          nodeId,
          spaceId: record.driveSpaceId ?? "",
          kind: mediaKind === "image" || mediaKind === "video" || mediaKind === "audio"
            ? mediaKind
            : "other",
          mediaKind,
          toolId: record.toolId ?? "",
          createdAt: record.createdAt ?? "",
          ...(sourceUrl ? { previewUrl: sourceUrl } : {}),
        });
      }

      // Resolve Drive view URLs in bounded batches so a large library neither
      // serializes into a slow screen nor floods the transport.
      const resolved: AssetItem[] = [];
      for (let index = 0; index < items.length; index += ASSET_RESOLVE_CONCURRENCY) {
        const batch = items.slice(index, index + ASSET_RESOLVE_CONCURRENCY);
        const urls = await Promise.all(
          batch.map((item) => (item.previewUrl ? item.previewUrl : resolveDrivePreviewUrl(item.nodeId))),
        );
        batch.forEach((item, offset) => {
          const url = urls[offset];
          resolved.push(url ? { ...item, previewUrl: url } : item);
        });
      }
      return resolved;
    },
  };
}

function readSchemaProperties(schema: Record<string, unknown> | undefined): Set<string> {
  if (!schema || typeof schema !== "object") {
    return new Set();
  }
  const properties = schema.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    return new Set();
  }
  return new Set(Object.keys(properties as Record<string, unknown>));
}

function toCreativeModality(category: string | undefined, toolId: string): CreativeModality | null {
  const normalizedCategory = (category ?? "").trim().toLowerCase();
  if (normalizedCategory === "image") return "image";
  if (normalizedCategory === "video") return "video";
  if (normalizedCategory === "music") return "music";
  const normalizedTool = toolId.trim().toLowerCase();
  if (normalizedTool.startsWith("image.")) return "image";
  if (normalizedTool.startsWith("video.")) return "video";
  if (normalizedTool.startsWith("music.")) return "music";
  return null;
}

function collectCreativeMedia(
  output: unknown,
  modality: CreativeModality,
  collected: CreativeMedia[] = [],
  depth = 0,
): CreativeMedia[] {
  if (depth > CREATIVE_OUTPUT_MAX_DEPTH || collected.length >= CREATIVE_MAX_MEDIA) {
    return collected;
  }
  if (Array.isArray(output)) {
    for (const entry of output) {
      collectCreativeMedia(entry, modality, collected, depth + 1);
      if (collected.length >= CREATIVE_MAX_MEDIA) break;
    }
    return collected;
  }
  if (!output || typeof output !== "object") {
    return collected;
  }
  const record = output as Record<string, unknown>;
  const url = typeof record.url === "string" ? record.url : undefined;
  if (url && /^https?:\/\//iu.test(url)) {
    const kind =
      record.kind === "image" || record.kind === "video" || record.kind === "audio"
        ? record.kind
        : modality === "image"
          ? "image"
          : modality === "video"
            ? "video"
            : "audio";
    if (!collected.some((media) => media.url === url)) {
      collected.push({ kind, url });
    }
    return collected;
  }
  for (const value of Object.values(record)) {
    if (collected.length >= CREATIVE_MAX_MEDIA) break;
    collectCreativeMedia(value, modality, collected, depth + 1);
  }
  return collected;
}

function resolveCreativeRunStatus(
  status: string | undefined,
  hasMedia: boolean,
  error: string | undefined,
): "pending" | "succeeded" | "failed" {
  if (error) return "failed";
  const normalized = (status ?? "").trim().toLowerCase();
  if (CREATIVE_SUCCEEDED_STATUSES.has(normalized)) {
    return hasMedia ? "succeeded" : "pending";
  }
  if (CREATIVE_PENDING_STATUSES.has(normalized)) {
    return "pending";
  }
  return hasMedia ? "succeeded" : "failed";
}

function createCreativePort(): CreativePort {
  return {
    async loadTools() {
      const client = getAgentsAppSdkClientWithSession();
      const entries = await client.ai.agents.tools.list();
      const tools: CreativeTool[] = [];
      for (const entry of entries) {
        if (!entry.enabled || entry.configured === false) {
          continue;
        }
        const toolId = typeof entry.toolId === "string" ? entry.toolId : "";
        if (toolId.length === 0) {
          continue;
        }
        const modality = toCreativeModality(entry.category, toolId);
        if (!modality) {
          continue;
        }
        const properties = readSchemaProperties(entry.inputSchema);
        if (!properties.has("prompt")) {
          continue;
        }
        tools.push({
          id: toolId,
          modality,
          label: entry.displayName?.trim() || entry.name?.trim() || toolId,
          ...(entry.description ? { description: entry.description } : {}),
          supportsSize: properties.has("size"),
        });
      }
      return tools;
    },

    async generate(input) {
      const client = getAgentsAppSdkClientWithSession();
      const response = await client.ai.agents.tools.invoke(input.tool.id, {
        arguments: {
          prompt: input.prompt,
          ...(input.tool.supportsSize
            ? { size: CREATIVE_ASPECT_SIZES[input.aspect] }
            : {}),
        },
        saveToDrive: true,
      });

      const media = collectCreativeMedia(response.output, input.tool.modality);
      const nodeId = response.driveAsset?.nodeId;
      if (nodeId) {
        const driveUrl = await resolveDrivePreviewUrl(nodeId);
        if (driveUrl && !media.some((entry) => entry.url === driveUrl)) {
          media.unshift({
            kind: input.tool.modality === "image"
              ? "image"
              : input.tool.modality === "video"
                ? "video"
                : "audio",
            url: driveUrl,
          });
        }
      }

      const error =
        typeof response.error === "string" && response.error.trim().length > 0
          ? response.error.trim()
          : undefined;
      return {
        id: response.toolCallId?.trim() || `${input.tool.id}:${Date.now()}`,
        toolId: input.tool.id,
        modality: input.tool.modality,
        prompt: input.prompt,
        aspect: input.aspect,
        status: resolveCreativeRunStatus(response.status, media.length > 0, error),
        createdAt: new Date().toISOString(),
        media: media.slice(0, CREATIVE_MAX_MEDIA),
        ...(error ? { error } : {}),
      };
    },
  };
}

/** Curated feed stream the PC inspiration surface reads. */
const INSPIRATION_DISCOVER_STREAM = "agents-inspiration-discover";

function readPayload(record: Record<string, unknown>): Record<string, unknown> {
  const payload = record.payload;
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
}

function toInspirationItem(item: FeedItem): InspirationItem | null {
  const payload = readPayload(item as unknown as Record<string, unknown>);
  const coverUrl = readString(payload, "src") ?? item.coverUrl;
  if (!coverUrl) {
    return null;
  }
  const mediaKind = readString(payload, "mediaKind");
  return {
    id: item.id,
    title: item.title,
    prompt: readString(payload, "prompt") ?? item.excerpt ?? item.title,
    coverUrl,
    ...(item.author?.name ? { author: item.author.name } : {}),
    ...(typeof item.reactionCount === "number" ? { likes: item.reactionCount } : {}),
    ...(mediaKind === "image" || mediaKind === "video" || mediaKind === "other"
      ? { mediaKind }
      : {}),
  };
}

function createInspirationPort(): InspirationPort {
  return {
    async loadFeed(channel) {
      const page = await getFeedsOpenSdkClient().feeds.streams.items.list(
        INSPIRATION_DISCOVER_STREAM,
        { pageSize: 24 },
      );
      const records = (page.items ?? []) as unknown as FeedItem[];
      const mapped = records
        .map(toInspirationItem)
        .filter((item): item is InspirationItem => item !== null);
      if (channel === "featured") {
        return [...mapped]
          .sort((left, right) => (right.likes ?? 0) - (left.likes ?? 0))
          .slice(0, 6);
      }
      return mapped;
    },
  };
}

function createMembershipPort(): MembershipPort {
  return {
    async loadCatalog() {
      const client = getMembershipAppSdkClientWithSession();
      const [currentResult, packagesResult, pointsResult, pointsHistoryResult] =
        await Promise.allSettled([
          client.memberships.current.retrieve(),
          client.memberships.packages.list({ status: "active", pageSize: 50 }),
          client.memberships.points.balance.retrieve(),
          client.memberships.points.history.list({ pageSize: 20 }),
        ]);
      if (packagesResult.status === "rejected") {
        throw packagesResult.reason;
      }
      let summary: MembershipSummary = { active: false };
      if (currentResult.status === "fulfilled") {
        const current = currentResult.value;
        if ((Number(current.planRank) || 0) > 0 || current.membershipStatus === "active") {
          summary = {
            active: true,
            ...(current.planName ? { levelName: current.planName } : {}),
            ...(current.expiresAt ? { expiresAt: current.expiresAt } : {}),
          };
        }
      }
      const plans: MembershipPlan[] = packagesResult.value.items.map((item) => ({
        id: String(item.id),
        name: item.name,
        ...(item.price ? { priceLabel: item.price } : {}),
        benefits: item.tags ?? [],
      }));
      const rawPoints =
        pointsResult.status === "fulfilled"
          ? pointsResult.value.availablePoints ?? pointsResult.value.points
          : undefined;
      const pointsBalance =
        rawPoints !== undefined && Number.isFinite(Number(rawPoints))
          ? Number(rawPoints)
          : undefined;
      const pointsHistory =
        pointsHistoryResult.status === "fulfilled"
          ? pointsHistoryResult.value.items.map((item) => ({
              id: String(item.id),
              changeType: item.changeType,
              changeAmount: item.changeAmount,
              ...(item.createdAt ? { createdAt: item.createdAt } : {}),
              ...(item.remark ? { remark: item.remark } : {}),
            }))
          : undefined;
      return {
        summary,
        plans,
        ...(pointsBalance !== undefined ? { pointsBalance } : {}),
        ...(pointsHistory ? { pointsHistory } : {}),
      };
    },

    async startCheckout(planId) {
      const payment = await getAgentsMembershipCheckoutService().createCheckout({
        action: "purchase",
        packageId: Number(planId),
        paymentProduct: "mobile_cashier_h5",
      });
      const cashierUrl = payment.cashierUrl;
      if (!cashierUrl) {
        throw new Error("Membership checkout did not return a cashier URL.");
      }
      globalThis.location?.assign(cashierUrl);
    },
  };
}

function createProfilePort(): ProfilePort {
  const environment = resolveEnvironment();
  return {
    loadAccount() {
      return {
        signedIn: isAppSdkSessionAuthenticated(),
        environment: environment.lifecycleEnvironment,
      };
    },
    async loadMembership() {
      try {
        const catalog = await MembershipService.loadCatalog();
        if (catalog.availability === "available") {
          return {
            active: catalog.summary.active,
            ...(catalog.summary.levelName ? { label: catalog.summary.levelName } : {}),
          };
        }
      } catch {
        // The membership service may be unavailable in hosted environments.
      }
      return null;
    },
    async loadUsage() {
      try {
        const summary = await getUsageSummary(getAgentsAppSdkClientWithSession());
        return {
          turnCount: summary.turnCount,
          inputTokens: summary.inputTokens,
          outputTokens: summary.outputTokens,
        };
      } catch {
        return null;
      }
    },
  };
}

function createSettingsPort() {
  const environment = resolveEnvironment();
  return {
    environment: environment.lifecycleEnvironment,
    accountLabel: isAppSdkSessionAuthenticated() ? "SDKWork" : "",
    localeLabel: getAgentsShellLocale(),
    setLocale(locale: "zh-CN" | "en-US") {
      setAgentsH5LocalePreference(locale);
      globalThis.location?.reload();
    },
    themeLabel: resolveAgentsH5ThemeMode(),
    setTheme(theme: "system" | "light" | "dark") {
      setAgentsH5ThemePreference(theme);
    },
    clearLocalCache() {
      try {
        const storage = globalThis.localStorage;
        if (!storage) return;
        const keys: string[] = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (key?.startsWith("sdkwork.agents.")) {
            keys.push(key);
          }
        }
        for (const key of keys) {
          storage.removeItem(key);
        }
      } catch {
        // A blocked storage surface must not break the settings page.
      }
    },
    signOut() {
      clearAppSdkSessionTokens();
      globalThis.location?.reload();
    },
  };
}

/** The PC canvas persists its browser-local workflow under this key. */
const CANVAS_WORKFLOW_STORAGE_KEY = "sdkwork_agents_canvas_workflow_v1";

const CANVAS_NODE_TYPES = new Set<CanvasNodeType>([
  "text",
  "image-gen",
  "video-gen",
  "flow-step",
  "sticky",
]);
const CANVAS_NODE_STATUSES = new Set<CanvasNodeStatus>([
  "idle",
  "generating",
  "completed",
  "failed",
]);

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toCanvasNode(value: unknown): CanvasNode | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const id = readString(record, "id");
  const rawType = readString(record, "type");
  if (!id || !rawType || !CANVAS_NODE_TYPES.has(rawType as CanvasNodeType)) {
    return null;
  }
  const rawStatus = readString(record, "status");
  const status =
    rawStatus && CANVAS_NODE_STATUSES.has(rawStatus as CanvasNodeStatus)
      ? (rawStatus as CanvasNodeStatus)
      : undefined;
  return {
    id,
    type: rawType as CanvasNodeType,
    x: readNumber(record, "x"),
    y: readNumber(record, "y"),
    width: readNumber(record, "width"),
    height: readNumber(record, "height"),
    title: readString(record, "title") ?? "",
    ...(readString(record, "content") ? { content: readString(record, "content") } : {}),
    ...(readString(record, "prompt") ? { prompt: readString(record, "prompt") } : {}),
    ...(status ? { status } : {}),
    ...(readString(record, "mediaUrl") ? { mediaUrl: readString(record, "mediaUrl") } : {}),
    ...(readString(record, "groupId") ? { groupId: readString(record, "groupId") } : {}),
  };
}

function toCanvasGroup(value: unknown): CanvasGroup | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const id = readString(record, "id");
  if (!id) {
    return null;
  }
  return { id, title: readString(record, "title") ?? "" };
}

function toCanvasConnection(value: unknown): CanvasConnection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const id = readString(record, "id");
  const fromNodeId = readString(record, "fromNodeId");
  const toNodeId = readString(record, "toNodeId");
  if (!id || !fromNodeId || !toNodeId) {
    return null;
  }
  return { id, fromNodeId, toNodeId };
}

function createCanvasPort(): CanvasPort {
  return {
    async loadWorkflow(): Promise<CanvasWorkflow | null> {
      try {
        const raw = globalThis.localStorage?.getItem(CANVAS_WORKFLOW_STORAGE_KEY);
        if (!raw) {
          return null;
        }
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return null;
        }
        const record = parsed as Record<string, unknown>;
        const nodes = Array.isArray(record.nodes)
          ? record.nodes.map(toCanvasNode).filter((node): node is CanvasNode => node !== null)
          : [];
        const groups = Array.isArray(record.groups)
          ? record.groups.map(toCanvasGroup).filter((group): group is CanvasGroup => group !== null)
          : [];
        const connections = Array.isArray(record.connections)
          ? record.connections
              .map(toCanvasConnection)
              .filter((connection): connection is CanvasConnection => connection !== null)
          : [];
        return { nodes, groups, connections };
      } catch {
        return null;
      }
    },
  };
}

/**
 * Wires every client capability port to its SDK-backed implementation. Called
 * once from the application bootstrap before the first render.
 */
export function configureAgentsH5Ports(): void {
  configureConversationPort(createConversationPort());
  configureAssetsPort(createAssetsPort());
  configureCanvasPort(createCanvasPort());
  configureCreativePort(createCreativePort());
  configureInspirationPort(createInspirationPort());
  configureLibraryPort(createLibraryPort());
  configureMembershipPort(createMembershipPort());
  configureProfilePort(createProfilePort());
  configureProjectsPort(createProjectsPort());
  configureSettingsPort(createSettingsPort());
  configureAutomationPort(createAutomationPort());
}

export { DEFAULT_CONVERSATION_AGENT_ID };
