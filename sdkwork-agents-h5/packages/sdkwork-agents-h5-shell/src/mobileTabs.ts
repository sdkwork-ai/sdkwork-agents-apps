/**
 * Bottom tab descriptors for the Agents mobile shells (H5, mini program,
 * Flutter). The tab set and the route id behind each tab are identical across
 * the mobile roots; only the rendered screen and the physical container differ.
 *
 * Authority: `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 4 (shell owns
 * tab/stack ownership) and section 7 (route identity alignment).
 */

import {
  AUTOMATION_INDEX_ROUTE_ID,
  AGENT_CATALOG_LIST_ROUTE_ID,
  CONVERSATION_CHAT_ROUTE_ID,
  LIBRARY_LIST_ROUTE_ID,
  PROJECTS_LIST_ROUTE_ID,
} from "./routeRegistry";

/** Stable tab identifiers shared by every mobile root. */
export type AgentsMobileTabId =
  | "tasks"
  | "experts"
  | "library"
  | "automation"
  | "projects";

export interface AgentsMobileTabDescriptor {
  readonly tab: AgentsMobileTabId;
  /** Route identity behind this tab (section 7). */
  readonly routeId: string;
  /** i18n key for the tab label. */
  readonly labelKey: string;
  /** Ordered leading glyph name resolved by the shell renderer. */
  readonly glyph: string;
}

export const AGENTS_MOBILE_TABS: readonly AgentsMobileTabDescriptor[] = [
  {
    tab: "tasks",
    routeId: CONVERSATION_CHAT_ROUTE_ID,
    labelKey: "agents.mobile.tab.tasks",
    glyph: "message-square",
  },
  {
    tab: "experts",
    routeId: AGENT_CATALOG_LIST_ROUTE_ID,
    labelKey: "agents.mobile.tab.experts",
    glyph: "infinity",
  },
  {
    tab: "library",
    routeId: LIBRARY_LIST_ROUTE_ID,
    labelKey: "agents.mobile.tab.library",
    glyph: "book-open",
  },
  {
    tab: "automation",
    routeId: AUTOMATION_INDEX_ROUTE_ID,
    labelKey: "agents.mobile.tab.automation",
    glyph: "timer",
  },
  {
    tab: "projects",
    routeId: PROJECTS_LIST_ROUTE_ID,
    labelKey: "agents.mobile.tab.projects",
    glyph: "share-2",
  },
];

/** Resolves the tab that owns a route id, or `undefined` for nested surfaces. */
export function resolveAgentsMobileTabByRouteId(
  routeId: string,
): AgentsMobileTabDescriptor | undefined {
  return AGENTS_MOBILE_TABS.find((entry) => entry.routeId === routeId);
}
