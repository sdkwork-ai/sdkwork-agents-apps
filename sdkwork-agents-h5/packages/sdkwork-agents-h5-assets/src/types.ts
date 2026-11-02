/**
 * Asset library types (`app.agents.assets.list`).
 *
 * The asset record is owned by the Agents app API `/ai/assets`; the Drive node
 * behind it carries the renderable media. This package models only what the
 * library screen displays.
 */

export type AssetKind = "image" | "video" | "audio" | "other";

export interface AssetItem {
  readonly id: string;
  readonly nodeId: string;
  readonly spaceId: string;
  readonly kind: AssetKind;
  readonly mediaKind: string;
  readonly toolId: string;
  readonly createdAt: string;
  readonly previewUrl?: string;
}

export interface AssetGroup {
  readonly dateKey: string;
  readonly items: readonly AssetItem[];
}
