/**
 * Public integration surface of the Agents H5 inspiration capability.
 */

export { InspirationScreen } from "./screens/InspirationScreen";
export type { InspirationScreenProps } from "./screens/InspirationScreen";

export { InspirationService } from "./services/InspirationService";
export type { InspirationFeed } from "./services/InspirationService";

export {
  configureInspirationPort,
  getInspirationPort,
  isInspirationPortConfigured,
  resetInspirationPort,
} from "./services/inspirationPort";
export type { InspirationPort } from "./services/inspirationPort";

export { inspirationRouteContributions } from "./routes/inspirationRouteContributions";

export {
  AGENTS_INSPIRATION_MESSAGES,
  DEFAULT_AGENTS_INSPIRATION_LOCALE,
  configureAgentsInspirationLocale,
  getAgentsInspirationLocale,
  normalizeAgentsInspirationLocale,
  translateAgentsInspirationText,
} from "./i18n";
export type { AgentsInspirationLocale, AgentsInspirationMessageKey } from "./i18n";

export type { InspirationChannel, InspirationItem } from "./types";
