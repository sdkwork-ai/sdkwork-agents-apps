/**
 * Asset library domain models for the Agents mini program.
 *
 * An asset is one media record the Agents app SDK persisted to Drive from a tool
 * invocation (`/ai/assets`). The asset library is the same projection the PC asset
 * surface renders: a flattened, date-grouped media grid.
 */

export type AgentsMpAssetKind = "image" | "video" | "audio" | "other";

export interface AgentsMpAssetItem {
  /** Drive node id — unique per persisted asset. */
  readonly id: string;
  readonly nodeId: string;
  readonly spaceId: string;
  readonly kind: AgentsMpAssetKind;
  /** Raw tool media kind as reported by the backend (`image`, `video`, ...). */
  readonly mediaKind: string;
  readonly toolId: string;
  /** ISO timestamp, empty when the record carries none. */
  readonly createdAt: string;
  /** Resolved preview URL: Drive download URL first, provider URL as fallback. */
  readonly previewUrl?: string;
}

export interface AgentsMpAssetGroup {
  /** `YYYY-MM-DD`, or an empty string for records without a timestamp. */
  readonly dateKey: string;
  readonly items: AgentsMpAssetItem[];
}
