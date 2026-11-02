export {
  AGENT_MARKET_ROUTE,
  AGENT_MARKET_SEARCH_ROUTE,
  CHAT_ROUTE,
  CREATE_AGENT_ROUTE,
  MY_AGENTS_ROUTE,
} from "./moduleRegistry";

export {
  AGENT_CATALOG_EDITOR_ROUTE_ID,
  AGENT_CATALOG_LIST_ROUTE_ID,
  ASSETS_DETAIL_ROUTE_ID,
  ASSETS_LIST_ROUTE_ID,
  ASSETS_PATH,
  AUTOMATION_INDEX_ROUTE_ID,
  AUTOMATION_PATH,
  CANVAS_BOARD_ROUTE_ID,
  CANVAS_PATH,
  CONVERSATION_CHAT_ROUTE_ID,
  CONVERSATION_LIST_PATH,
  CONVERSATION_LIST_ROUTE_ID,
  CONVERSATION_PATH,
  CREATIVE_PATH,
  CREATIVE_STUDIO_ROUTE_ID,
  EXPERTS_PATH,
  INSPIRATION_DISCOVER_ROUTE_ID,
  INSPIRATION_PATH,
  LIBRARY_LIST_ROUTE_ID,
  LIBRARY_PATH,
  MEMBERSHIP_CATALOG_ROUTE_ID,
  MEMBERSHIP_PATH,
  PROFILE_INDEX_ROUTE_ID,
  PROFILE_PATH,
  PROJECTS_LIST_ROUTE_ID,
  PROJECTS_PATH,
  SETTINGS_INDEX_ROUTE_ID,
  SETTINGS_PATH,
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
  AGENTS_H5_PROFILE_LINKS,
  resolveAgentsH5ProfileLink,
} from "./profileLinks";
export type { AgentsH5ProfileLinkDescriptor } from "./profileLinks";

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
