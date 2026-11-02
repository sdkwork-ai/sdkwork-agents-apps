/**
 * Bottom tab descriptors for the Agents mini program shell.
 *
 * The tab set and the route id behind each tab are identical to the PC
 * workbench sidebar's primary surfaces and to the H5 and Flutter mobile roots;
 * only the physical page path differs
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 4 and 7,
 * `specs/client-page-parity.spec.json` `navigation.mobileBottomTabs`).
 *
 * Secondary surfaces (projects, library, automation, history, settings,
 * membership) stay registered as normal pages and are reached from the profile
 * surface instead of consuming a tab slot.
 */

import {
  AGENTS_MP_ASSETS_LIST_ROUTE_ID,
  AGENTS_MP_ASSETS_PAGE,
  AGENTS_MP_CATALOG_LIST_ROUTE_ID,
  AGENTS_MP_CONVERSATION_CHAT_ROUTE_ID,
  AGENTS_MP_CONVERSATION_PAGE,
  AGENTS_MP_CREATIVE_PAGE,
  AGENTS_MP_CREATIVE_STUDIO_ROUTE_ID,
  AGENTS_MP_EXPERTS_PAGE,
  AGENTS_MP_INSPIRATION_DISCOVER_ROUTE_ID,
  AGENTS_MP_INSPIRATION_PAGE,
} from "./routeRegistry";

/** Stable tab identifiers shared by every mobile root. */
export type AgentsMpTabId = "chat" | "inspiration" | "creative" | "assets" | "agents";

export interface AgentsMpTabDescriptor {
  readonly tab: AgentsMpTabId;
  /** Route identity behind this tab (section 7). */
  readonly routeId: string;
  /** Mini program page that renders the tab (no leading slash in `app.json`). */
  readonly pagePath: string;
  /** `wx.switchTab` target (tab bar pages are addressed with a leading slash). */
  readonly url: string;
  /** i18n key for the tab label. */
  readonly labelKey: string;
  /** Glyph name resolved by the shell renderer. */
  readonly glyph: string;
}

function toTab(
  tab: AgentsMpTabId,
  routeId: string,
  pagePath: string,
  labelKey: string,
  glyph: string,
): AgentsMpTabDescriptor {
  return { tab, routeId, pagePath, url: `/${pagePath}`, labelKey, glyph };
}

/**
 * The five PC-primary surfaces, in the contract's order:
 * 对话, 灵感, 生成, 资产, Agent.
 */
export const AGENTS_MP_TABS: readonly AgentsMpTabDescriptor[] = [
  toTab(
    "chat",
    AGENTS_MP_CONVERSATION_CHAT_ROUTE_ID,
    AGENTS_MP_CONVERSATION_PAGE,
    "agents.mobile.tab.tasks",
    "message-square",
  ),
  toTab(
    "inspiration",
    AGENTS_MP_INSPIRATION_DISCOVER_ROUTE_ID,
    AGENTS_MP_INSPIRATION_PAGE,
    "agents.mobile.tab.inspiration",
    "sparkles",
  ),
  toTab(
    "creative",
    AGENTS_MP_CREATIVE_STUDIO_ROUTE_ID,
    AGENTS_MP_CREATIVE_PAGE,
    "agents.mobile.tab.creative",
    "palette",
  ),
  toTab(
    "assets",
    AGENTS_MP_ASSETS_LIST_ROUTE_ID,
    AGENTS_MP_ASSETS_PAGE,
    "agents.mobile.tab.assets",
    "image",
  ),
  toTab(
    "agents",
    AGENTS_MP_CATALOG_LIST_ROUTE_ID,
    AGENTS_MP_EXPERTS_PAGE,
    "agents.mobile.tab.experts",
    "infinity",
  ),
];

/** Resolves the tab that owns a route id, or `undefined` for nested surfaces. */
export function resolveAgentsMpTabByRouteId(routeId: string): AgentsMpTabDescriptor | undefined {
  return AGENTS_MP_TABS.find((entry) => entry.routeId === routeId);
}

/**
 * Platform glyph for a tab icon.
 *
 * Mini program WXML cannot inline the SVG icon components the PC and H5 roots
 * use, and this root ships no binary icon assets, so the shell renders a
 * monochrome text symbol instead. Text presentation inherits `color`, which is
 * what keeps the active/inactive affordance working; the glyph *name* stays the
 * shared vocabulary (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */
const TAB_GLYPH_SYMBOLS: Record<string, string> = {
  "message-square": "▣",
  sparkles: "✦",
  palette: "◒",
  image: "▨",
  infinity: "∞",
  "book-open": "▤",
  timer: "◷",
  "share-2": "◈",
};

export function resolveAgentsMpTabGlyphSymbol(glyph: string): string {
  return TAB_GLYPH_SYMBOLS[glyph] ?? "•";
}

/** Tab label/icon state for one page, so every page renders the same tab bar. */
export interface AgentsMpTabBarItem {
  readonly tab: AgentsMpTabId;
  readonly url: string;
  readonly label: string;
  readonly glyph: string;
  readonly symbol: string;
  readonly active: boolean;
}

export function resolveAgentsMpTabBarItems(
  activeTab: AgentsMpTabId,
  translate: (key: string) => string,
): AgentsMpTabBarItem[] {
  return AGENTS_MP_TABS.map((entry) => ({
    tab: entry.tab,
    url: entry.url,
    label: translate(entry.labelKey),
    glyph: entry.glyph,
    symbol: resolveAgentsMpTabGlyphSymbol(entry.glyph),
    active: entry.tab === activeTab,
  }));
}
