import {
  type SdkworkAgentsAppClient,
  type SdkworkAgentsMpDriveAppClient,
} from "../../sdk";

import {
  type AgentsMpAssetGroup,
  type AgentsMpAssetItem,
  type AgentsMpAssetKind,
} from "./assetsModels";

/**
 * Asset library orchestration.
 *
 * `/ai/assets` lists the generated media the backend persisted to Drive; the
 * Drive app SDK resolves a short-lived view URL per node. Both clients are
 * injected by the compose root (`MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md`
 * section 4), so this service never constructs transport.
 */

/** View-URL lifetime requested from Drive, in seconds. */
const DRIVE_URL_TTL_SECONDS = 900;
/** Concurrent download-URL resolutions; the asset list can be long. */
const RESOLVE_CONCURRENCY = 6;

/** Raw asset record shape; the transport DTO is generator-owned. */
export interface AgentsMpRawToolAssetRecord {
  readonly toolId?: string;
  readonly toolCallId?: string;
  readonly mediaKind?: string;
  readonly driveSpaceId?: string;
  readonly driveNodeId?: string;
  readonly driveUri?: string;
  readonly sourceUrl?: string | null;
  readonly createdAt?: string;
}

export function toAgentsMpAssetKind(mediaKind: string | undefined): AgentsMpAssetKind {
  const normalized = (mediaKind ?? "").trim().toLowerCase();
  if (normalized === "image" || normalized === "video" || normalized === "audio") {
    return normalized;
  }
  return "other";
}

/** Maps one backend asset record, or `null` when it has no Drive node to open. */
export function mapAgentsMpAssetItem(record: AgentsMpRawToolAssetRecord): AgentsMpAssetItem | null {
  const nodeId = typeof record.driveNodeId === "string" ? record.driveNodeId : "";
  if (nodeId.length === 0) {
    return null;
  }
  const mediaKind = typeof record.mediaKind === "string" ? record.mediaKind : "";
  const sourceUrl = typeof record.sourceUrl === "string" && record.sourceUrl.length > 0
    ? record.sourceUrl
    : undefined;
  return {
    id: nodeId,
    nodeId,
    spaceId: record.driveSpaceId ?? "",
    kind: toAgentsMpAssetKind(mediaKind),
    mediaKind,
    toolId: record.toolId ?? "",
    createdAt: record.createdAt ?? "",
    ...(sourceUrl ? { previewUrl: sourceUrl } : {}),
  };
}

/**
 * Groups assets by calendar day, newest first.
 *
 * The service keeps the grouping key only; formatting the label (locale month and
 * day) belongs to the page (`I18N_SPEC.md` section 6.1).
 */
export function groupAgentsMpAssetsByDate(
  items: readonly AgentsMpAssetItem[],
): AgentsMpAssetGroup[] {
  const groups = new Map<string, AgentsMpAssetItem[]>();
  for (const item of items) {
    const dateKey = item.createdAt.slice(0, 10);
    const bucket = groups.get(dateKey);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(dateKey, [item]);
    }
  }
  return [...groups.entries()]
    .sort((left, right) => (left[0] < right[0] ? 1 : left[0] > right[0] ? -1 : 0))
    .map(([dateKey, groupItems]) => ({
      dateKey,
      items: [...groupItems].sort((left, right) =>
        left.createdAt < right.createdAt ? 1 : left.createdAt > right.createdAt ? -1 : 0,
      ),
    }));
}

export interface AgentsMpAssetsService {
  listAssets(): Promise<AgentsMpAssetItem[]>;
  resolvePreviewUrl(nodeId: string): Promise<string | undefined>;
  groupByDate(items: readonly AgentsMpAssetItem[]): AgentsMpAssetGroup[];
}

export function createAgentsMpAssetsService(
  client: SdkworkAgentsAppClient,
  driveClient: SdkworkAgentsMpDriveAppClient,
): AgentsMpAssetsService {
  const resolvePreviewUrl = async (nodeId: string): Promise<string | undefined> => {
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
    async listAssets() {
      const records = (await client.ai.agents.assets.list()) as AgentsMpRawToolAssetRecord[];
      const items = records
        .map(mapAgentsMpAssetItem)
        .filter((item): item is AgentsMpAssetItem => item !== null);

      // Resolve Drive view URLs in bounded batches so a large library neither
      // serializes into a slow screen nor floods the transport.
      const resolved: AgentsMpAssetItem[] = [];
      for (let index = 0; index < items.length; index += RESOLVE_CONCURRENCY) {
        const batch = items.slice(index, index + RESOLVE_CONCURRENCY);
        const urls = await Promise.all(batch.map((item) => resolvePreviewUrl(item.nodeId)));
        batch.forEach((item, offset) => {
          const driveUrl = urls[offset];
          resolved.push(driveUrl ? { ...item, previewUrl: driveUrl } : item);
        });
      }
      return resolved;
    },

    resolvePreviewUrl,

    groupByDate(items) {
      return groupAgentsMpAssetsByDate(items);
    },
  };
}
