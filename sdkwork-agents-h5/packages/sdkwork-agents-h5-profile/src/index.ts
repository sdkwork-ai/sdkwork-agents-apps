/**
 * Public integration surface of the Agents H5 profile capability.
 */

export { ProfileScreen } from "./screens/ProfileScreen";
export type { ProfileScreenProps } from "./screens/ProfileScreen";

export { ProfileService } from "./services/ProfileService";

export {
  configureProfilePort,
  getProfilePort,
  resetProfilePort,
} from "./services/profilePort";
export type { ProfilePort } from "./services/profilePort";

export { profileRouteContributions } from "./routes/profileRouteContributions";

export {
  AGENTS_PROFILE_MESSAGES,
  DEFAULT_AGENTS_PROFILE_LOCALE,
  configureAgentsProfileLocale,
  getAgentsProfileLocale,
  normalizeAgentsProfileLocale,
  translateAgentsProfileText,
} from "./i18n";
export type { AgentsProfileLocale, AgentsProfileMessageKey } from "./i18n";

export type {
  ProfileAccount,
  ProfileLink,
  ProfileMembership,
} from "./types";
