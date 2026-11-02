/**
 * Bottom tab descriptors for the Agents mobile shells (H5, mini program,
 * Flutter). The tab set and the route id behind each tab are identical across
 * the mobile roots; only the rendered screen and the physical container differ.
 *
 * Authority: `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 4 (shell owns
 * tab/stack ownership) and section 7 (route identity alignment). The five tabs
 * mirror the PC sidebar's primary surfaces; every other PC page stays reachable
 * from the profile hub instead of adding tab slots.
 */

import {
  AGENT_CATALOG_LIST_ROUTE_ID,
  ASSETS_LIST_ROUTE_ID,
  CONVERSATION_CHAT_ROUTE_ID,
  CREATIVE_STUDIO_ROUTE_ID,
  INSPIRATION_DISCOVER_ROUTE_ID,
} from "./routeRegistry";

/** Stable tab identifiers shared by every mobile root. */
export type AgentsMobileTabId =
  | "chat"
  | "inspiration"
  | "creative"
  | "assets"
  | "agents";

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
    tab: "chat",
    routeId: CONVERSATION_CHAT_ROUTE_ID,
    labelKey: "agents.mobile.tab.chat",
    glyph: "message-square",
  },
  {
    tab: "inspiration",
    routeId: INSPIRATION_DISCOVER_ROUTE_ID,
    labelKey: "agents.mobile.tab.inspiration",
    glyph: "sparkles",
  },
  {
    tab: "creative",
    routeId: CREATIVE_STUDIO_ROUTE_ID,
    labelKey: "agents.mobile.tab.creative",
    glyph: "wand-2",
  },
  {
    tab: "assets",
    routeId: ASSETS_LIST_ROUTE_ID,
    labelKey: "agents.mobile.tab.assets",
    glyph: "images",
  },
  {
    tab: "agents",
    routeId: AGENT_CATALOG_LIST_ROUTE_ID,
    labelKey: "agents.mobile.tab.agents",
    glyph: "infinity",
  },
];

/** Resolves the tab that owns a route id, or `undefined` for nested surfaces. */
export function resolveAgentsMobileTabByRouteId(
  routeId: string,
): AgentsMobileTabDescriptor | undefined {
  return AGENTS_MOBILE_TABS.find((entry) => entry.routeId === routeId);
}
