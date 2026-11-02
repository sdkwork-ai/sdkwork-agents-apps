/**
 * Public integration surface of the Agents H5 creative capability.
 */

export { CreativeScreen } from "./screens/CreativeScreen";
export type { CreativeScreenProps } from "./screens/CreativeScreen";

export { CREATIVE_MAX_RUNS, CreativeService } from "./services/CreativeService";

export {
  configureCreativePort,
  getCreativePort,
  isCreativePortConfigured,
  resetCreativePort,
} from "./services/creativePort";
export type { CreativeGenerateInput, CreativePort } from "./services/creativePort";

export { creativeRouteContributions } from "./routes/creativeRouteContributions";

export {
  AGENTS_CREATIVE_MESSAGES,
  DEFAULT_AGENTS_CREATIVE_LOCALE,
  configureAgentsCreativeLocale,
  getAgentsCreativeLocale,
  normalizeAgentsCreativeLocale,
  translateAgentsCreativeText,
} from "./i18n";
export type { AgentsCreativeLocale, AgentsCreativeMessageKey } from "./i18n";

export type {
  CreativeAspect,
  CreativeCatalog,
  CreativeMedia,
  CreativeModality,
  CreativeRun,
  CreativeRunStatus,
  CreativeTool,
} from "./types";
