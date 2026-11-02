/**
 * Public integration surface of the Agents H5 membership capability.
 */

export { MembershipScreen } from "./screens/MembershipScreen";
export type { MembershipScreenProps } from "./screens/MembershipScreen";

export { MembershipService } from "./services/MembershipService";
export type { MembershipCatalogResult, MembershipCheckoutResult } from "./services/MembershipService";

export {
  configureMembershipPort,
  getMembershipPort,
  isMembershipPortConfigured,
  resetMembershipPort,
} from "./services/membershipPort";
export type { MembershipPort } from "./services/membershipPort";

export { membershipRouteContributions } from "./routes/membershipRouteContributions";

export {
  AGENTS_MEMBERSHIP_MESSAGES,
  DEFAULT_AGENTS_MEMBERSHIP_LOCALE,
  configureAgentsMembershipLocale,
  getAgentsMembershipLocale,
  normalizeAgentsMembershipLocale,
  translateAgentsMembershipText,
} from "./i18n";
export type { AgentsMembershipLocale, AgentsMembershipMessageKey } from "./i18n";

export type {
  MembershipCatalog,
  MembershipPlan,
  MembershipSummary,
} from "./types";
