export {
  AGENT_MARKET_ROUTE,
  AGENT_MARKET_SEARCH_ROUTE,
  CHAT_ROUTE,
  CREATE_AGENT_ROUTE,
  MY_AGENTS_ROUTE,
} from "./moduleRegistry";

export {
  AGENT_CATALOG_LIST_ROUTE_ID,
  AUTOMATION_INDEX_ROUTE_ID,
  AUTOMATION_PATH,
  CONVERSATION_CHAT_ROUTE_ID,
  CONVERSATION_LIST_PATH,
  CONVERSATION_LIST_ROUTE_ID,
  CONVERSATION_PATH,
  EXPERTS_PATH,
  LIBRARY_LIST_ROUTE_ID,
  LIBRARY_PATH,
  PROJECTS_LIST_ROUTE_ID,
  PROJECTS_PATH,
  assembleAgentsH5RouteRegistry,
  isAlignedAgentsH5RouteContribution,
} from "./routeRegistry";
export type { AgentsH5RouteContribution } from "./routeRegistry";

export {
  AGENTS_MOBILE_TABS,
  resolveAgentsMobileTabByRouteId,
} from "./mobileTabs";
export type { AgentsMobileTabDescriptor, AgentsMobileTabId } from "./mobileTabs";

export {
  AGENTS_SHELL_MESSAGES,
  DEFAULT_AGENTS_SHELL_LOCALE,
  configureAgentsShellLocale,
  getAgentsShellLocale,
  normalizeAgentsShellLocale,
  resolveAgentsShellMessages,
  translateAgentsShellText,
} from "./i18n";
export type {
  AgentsShellLocale,
  AgentsShellMessageKey,
  AgentsShellMessages,
} from "./i18n";
