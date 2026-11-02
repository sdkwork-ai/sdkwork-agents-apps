/**
 * Public integration surface of the Agents H5 assets capability.
 */

export { AssetsScreen } from "./screens/AssetsScreen";
export type { AssetsScreenProps } from "./screens/AssetsScreen";

export { AssetDetailScreen } from "./screens/AssetDetailScreen";
export type { AssetDetailScreenProps } from "./screens/AssetDetailScreen";

export { AssetsService, groupAssetsByDate, toAssetKind } from "./services/AssetsService";
export type { AssetLibrary } from "./services/AssetsService";

export {
  configureAssetsPort,
  getAssetsPort,
  isAssetsPortConfigured,
  resetAssetsPort,
} from "./services/assetsPort";
export type { AssetsPort } from "./services/assetsPort";

export { assetsRouteContributions } from "./routes/assetsRouteContributions";

export {
  AGENTS_ASSETS_MESSAGES,
  DEFAULT_AGENTS_ASSETS_LOCALE,
  configureAgentsAssetsLocale,
  getAgentsAssetsLocale,
  normalizeAgentsAssetsLocale,
  translateAgentsAssetsText,
} from "./i18n";
export type { AgentsAssetsLocale, AgentsAssetsMessageKey } from "./i18n";

export type { AssetGroup, AssetItem, AssetKind } from "./types";
