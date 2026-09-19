import { bootstrap } from "./runtime";
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

// Shell: route identity, bottom tabs, and locale boundary.
export {
  AGENTS_MP_TABS,
  getAgentsMpShellLocale,
  resolveAgentsMpTabBarItems,
  resolveAgentsMpTabByRouteId,
  translateAgentsMpShellText,
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
