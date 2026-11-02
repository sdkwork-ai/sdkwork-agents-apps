import { applyAgentsMiniProgramLocale, bootstrap } from "./runtime";
import {
  configureAgentsAppSdkBaseUrl,
  configureAgentsAppSdkBootstrapAccessToken,
  getAgentsAppSdkClient,
  getDriveAppSdkClient,
} from "@sdkwork/agents-mp-core/sdk";

export interface AgentsMiniProgramRuntimeOptions {
  appApiBaseUrl?: string;
  accessToken?: string;
  locale?: string;
}

export function bootstrapAgentsMiniProgram(options: AgentsMiniProgramRuntimeOptions = {}) {
  return bootstrap(options);
}

export function getAgentsMpSdkClient() {
  return getAgentsAppSdkClient();
}

export function getAgentsMpDriveSdkClient() {
  return getDriveAppSdkClient();
}

export { configureAgentsAppSdkBaseUrl, configureAgentsAppSdkBootstrapAccessToken };

/** Re-injects the locale after the user switches language on the settings page. */
export function applyAgentsMpLocale(locale: string): void {
  applyAgentsMiniProgramLocale(locale.toLowerCase().startsWith("en") ? "en-US" : "zh-CN");
}

export {
  AGENTS_MP_LOCALE_STORAGE_KEY,
  AGENTS_MP_THEME_STORAGE_KEY,
  applyAgentsMpTheme,
  readStoredString as readAgentsMpStoredString,
  resolveAgentsMpThemeClass,
  writeStoredString as writeAgentsMpStoredString,
  type AgentsMpThemePreference,
} from "./platformStores";

// Mini program composition root. Platform pages call these instead of building
// transport or re-implementing mapping/pagination.
export {
  createAgentsMpRuntimeServices,
  getAgentsMpRuntimeServices,
  resetAgentsMpRuntimeServices,
  type AgentsMpRuntimeServices,
} from "./services";
export {
  createRoutes,
  listRootPages,
  listSubpackages,
  type AgentsMpSubpackageDescriptor,
} from "./routes";
export { getAgentsMpWindowInsets, type AgentsMpHostAdapters } from "./hostAdapters";

// Shell: route identity, bottom tabs, profile hub, and locale boundary.
export {
  AGENTS_MP_PROFILE_LINKS,
  AGENTS_MP_PROFILE_PAGE_URL,
  AGENTS_MP_TABS,
  getAgentsMpShellLocale,
  resolveAgentsMpProfileLinks,
  resolveAgentsMpTabBarItems,
  resolveAgentsMpTabByRouteId,
  shellMpRouteContributions,
  translateAgentsMpShellText,
  type AgentsMpProfileLinkItem,
  type AgentsMpTabBarItem,
  type AgentsMpTabDescriptor,
  type AgentsMpTabId,
  type AgentsMpRouteContribution,
} from "@sdkwork/agents-mp-shell";

// Commons: design tokens and list/screen state primitives.
export { agentsMpTokens, resolveAgentsMpScreenStatus } from "@sdkwork/agents-mp-commons";

// Agents capability.
export {
  createAgentCatalogService,
  resolveAgentsMpCatalogScreenState,
  agentsMpCatalogFragments,
  type AgentCatalogService,
  type AgentsMpCatalogItem,
  type AgentsMpCatalogPage,
} from "@sdkwork/agents-mp-agents";

// Conversation capability.
export {
  createAgentsMpConversationService,
  initialAgentsMpConversationState,
  clearAgentsMpConversationState,
  nextAgentsMpLocalMessageId,
  appendAgentsMpMessageText,
  appendAgentsMpMessageReasoning,
  applyAgentsMpToolEventToMessage,
  finishAgentsMpMessage,
  translateAgentsMpConversationText,
  type AgentsMpConversationMessage,
  type AgentsMpConversationService,
  type AgentsMpConversationSession,
  type AgentsMpConversationStateSlice,
} from "@sdkwork/agents-mp-conversation";

// Library capability.
export {
  createAgentsMpLibraryService,
  filterAgentsMpLibraryFiles,
  translateAgentsMpLibraryText,
  type AgentsMpLibraryFile,
  type AgentsMpLibraryService,
} from "@sdkwork/agents-mp-library";

// Projects capability.
export {
  createAgentsMpProjectsService,
  filterAgentsMpProjects,
  translateAgentsMpProjectsText,
  type AgentsMpProjectSummary,
  type AgentsMpProjectsService,
} from "@sdkwork/agents-mp-projects";

// Automation capability.
export {
  createAgentsMpAutomationService,
  filterAgentsMpTasks,
  translateAgentsMpAutomationText,
  type AgentsMpAutomationService,
  type AgentsMpTaskSummary,
} from "@sdkwork/agents-mp-automation";

// M1 primary-surface capabilities (inspiration, creative, assets, membership,
// profile). Their transports and device ports are composed in `services.ts`.
export {
  AGENTS_MP_CREATIVE_ASPECT_SIZES,
  AGENTS_MP_CREATIVE_MAX_RUNS,
  createAgentsMpAssetsService,
  createAgentsMpCreativeService,
  createAgentsMpInspirationService,
  createAgentsMpMembershipService,
  createAgentsMpProfileService,
  groupAgentsMpAssetsByDate,
  type AgentsMpAssetGroup,
  type AgentsMpAssetItem,
  type AgentsMpAssetKind,
  type AgentsMpAssetsService,
  type AgentsMpCreativeAspect,
  type AgentsMpCreativeAvailability,
  type AgentsMpCreativeCatalog,
  type AgentsMpCreativeMedia,
  type AgentsMpCreativeModality,
  type AgentsMpCreativeRun,
  type AgentsMpCreativeService,
  type AgentsMpCreativeTool,
  type AgentsMpInspirationItem,
  type AgentsMpInspirationService,
  type AgentsMpMembershipCatalog,
  type AgentsMpMembershipService,
  type AgentsMpProfileService,
  type AgentsMpProfileSnapshot,
} from "@sdkwork/agents-mp-core/capabilities";
