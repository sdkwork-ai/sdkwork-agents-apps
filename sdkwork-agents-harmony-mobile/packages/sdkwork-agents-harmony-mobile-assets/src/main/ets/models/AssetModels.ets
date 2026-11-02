/**
 * View models for the assets capability.
 *
 * API DTOs come from generated ArkTS/TypeScript SDKs; this file owns view models
 * only.
 */
export interface AssetKindFilter {
  readonly id: string;
  readonly labelKey: string;
}

export interface AssetItem {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly mediaUrl: string;
  readonly createdAt: string;
  readonly aspectRatio: string;
  readonly resolution: string;
}

/** One date bucket of the asset grid. */
export interface AssetDateGroup {
  readonly date: string;
  readonly items: AssetItem[];
}
