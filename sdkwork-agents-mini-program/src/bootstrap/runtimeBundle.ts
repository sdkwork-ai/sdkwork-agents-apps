import { bootstrap } from "./runtime";
import {
  configureAgentsAppSdkBaseUrl,
  configureAgentsAppSdkBootstrapAccessToken,
  getAgentsAppSdkClient,
} from "@sdkwork/agents-mp-core/sdk";

export interface AgentsMiniProgramRuntimeOptions {
  appApiBaseUrl?: string;
}

export function bootstrapAgentsMiniProgram(options: AgentsMiniProgramRuntimeOptions = {}) {
  return bootstrap(options);
}

export function getAgentsMpSdkClient() {
  return getAgentsAppSdkClient();
}

export { configureAgentsAppSdkBaseUrl, configureAgentsAppSdkBootstrapAccessToken };

// Capability package surface projected into the mini program runtime bundle.
// Platform pages consume these instead of duplicating mapping/pagination logic,
// and never construct SDK clients themselves.
export {
  createAgentCatalogService,
  resolveAgentsMpCatalogScreenState,
  agentsMpRouteContributions,
  type AgentCatalogService,
  type AgentsMpCatalogItem,
  type AgentsMpCatalogPage,
} from "@sdkwork/agents-mp-agents";
export { projectAgentsMpPages, listAgentsMpRootPages } from "@sdkwork/agents-mp-shell";
export { agentsMpTokens, resolveAgentsMpScreenStatus } from "@sdkwork/agents-mp-commons";
