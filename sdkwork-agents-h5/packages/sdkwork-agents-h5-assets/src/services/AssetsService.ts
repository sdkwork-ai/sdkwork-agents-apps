import type { AssetGroup, AssetItem, AssetKind } from "../types";
import { getAssetsPort, isAssetsPortConfigured } from "./assetsPort";

export type AssetLibrary =
  | { readonly availability: "available"; readonly items: readonly AssetItem[] }
  | { readonly availability: "unavailable"; readonly reason: "transport-not-composed" };

export function toAssetKind(mediaKind: string | undefined): AssetKind {
  const normalized = (mediaKind ?? "").trim().toLowerCase();
  if (normalized === "image" || normalized === "video" || normalized === "audio") {
    return normalized;
  }
  return "other";
}

/** Groups assets by calendar day, newest day first. */
export function groupAssetsByDate(items: readonly AssetItem[]): AssetGroup[] {
  const groups = new Map<string, AssetItem[]>();
  for (const item of items) {
    const dateKey = item.createdAt.slice(0, 10) || "unknown";
    const bucket = groups.get(dateKey);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(dateKey, [item]);
    }
  }
  return [...groups.entries()]
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([dateKey, groupItems]) => ({
      dateKey,
      items: [...groupItems].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    }));
}

export class AssetsService {
  static async list(): Promise<AssetLibrary> {
    if (!isAssetsPortConfigured()) {
      return { availability: "unavailable", reason: "transport-not-composed" };
    }
    const items = await getAssetsPort().listAssets();
    return { availability: "available", items };
  }

  static filterByKind(items: readonly AssetItem[], kind: AssetKind | "all"): AssetItem[] {
    return kind === "all" ? [...items] : items.filter((item) => item.kind === kind);
  }

  static group(items: readonly AssetItem[]): AssetGroup[] {
    return groupAssetsByDate(items);
  }
}
