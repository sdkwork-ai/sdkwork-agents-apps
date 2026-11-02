/**
 * Profile-hub link model for the Agents mini program shell.
 *
 * The five PC-primary surfaces own the bottom tab slots; every remaining PC page
 * stays reachable from the profile surface instead of consuming a tab slot
 * (`specs/client-page-parity.spec.json` `navigation.mobileProfileLinks`).
 */

import {
  AGENTS_MP_AUTOMATION_INDEX_ROUTE_ID,
  AGENTS_MP_AUTOMATION_PAGE,
  AGENTS_MP_CONVERSATION_HISTORY_PAGE,
  AGENTS_MP_CONVERSATION_LIST_ROUTE_ID,
  AGENTS_MP_LIBRARY_LIST_ROUTE_ID,
  AGENTS_MP_LIBRARY_PAGE,
  AGENTS_MP_MEMBERSHIP_CATALOG_ROUTE_ID,
  AGENTS_MP_MEMBERSHIP_PAGE,
  AGENTS_MP_PROFILE_PAGE,
  AGENTS_MP_PROJECTS_LIST_ROUTE_ID,
  AGENTS_MP_PROJECTS_PAGE,
  AGENTS_MP_SETTINGS_INDEX_ROUTE_ID,
  AGENTS_MP_SETTINGS_PAGE,
} from "./routeRegistry";

/** Subpackage that hosts the conversation-history page. */
export const AGENTS_MP_HISTORY_SUBPACKAGE = "agents-sessions" as const;

/** Profile page address used by the avatar entry on every tab page. */
export const AGENTS_MP_PROFILE_PAGE_URL = `/${AGENTS_MP_PROFILE_PAGE}` as const;

/** Page-open strategy: `wx.navigateTo` for stack pages, `wx.switchTab` for tabs. */
export type AgentsMpNavigationMode = "navigate" | "switchTab";

export interface AgentsMpProfileLinkDescriptor {
  /** Route identity of the destination (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7). */
  readonly routeId: string;
  /** i18n key for the visible label. */
  readonly labelKey: string;
  /** Absolute mini program URL. */
  readonly url: string;
  readonly mode: AgentsMpNavigationMode;
  /** Single-glyph affordance rendered by the shell (no binary icon assets ship). */
  readonly glyph: string;
}

/**
 * Profile links, in contract order: membership, projects, library, automation,
 * conversation history, settings.
 */
export const AGENTS_MP_PROFILE_LINKS: readonly AgentsMpProfileLinkDescriptor[] = [
  {
    routeId: AGENTS_MP_MEMBERSHIP_CATALOG_ROUTE_ID,
    labelKey: "agents.mobile.link.membership",
    url: `/${AGENTS_MP_MEMBERSHIP_PAGE}`,
    mode: "navigate",
    glyph: "★",
  },
  {
    routeId: AGENTS_MP_PROJECTS_LIST_ROUTE_ID,
    labelKey: "agents.mobile.link.projects",
    url: `/${AGENTS_MP_PROJECTS_PAGE}`,
    mode: "navigate",
    glyph: "◈",
  },
  {
    routeId: AGENTS_MP_LIBRARY_LIST_ROUTE_ID,
    labelKey: "agents.mobile.link.library",
    url: `/${AGENTS_MP_LIBRARY_PAGE}`,
    mode: "navigate",
    glyph: "▤",
  },
  {
    routeId: AGENTS_MP_AUTOMATION_INDEX_ROUTE_ID,
    labelKey: "agents.mobile.link.automation",
    url: `/${AGENTS_MP_AUTOMATION_PAGE}`,
    mode: "navigate",
    glyph: "◷",
  },
  {
    routeId: AGENTS_MP_CONVERSATION_LIST_ROUTE_ID,
    labelKey: "agents.mobile.link.history",
    url: `/${AGENTS_MP_HISTORY_SUBPACKAGE}/${AGENTS_MP_CONVERSATION_HISTORY_PAGE}`,
    mode: "navigate",
    glyph: "☰",
  },
  {
    routeId: AGENTS_MP_SETTINGS_INDEX_ROUTE_ID,
    labelKey: "agents.mobile.link.settings",
    url: `/${AGENTS_MP_SETTINGS_PAGE}`,
    mode: "navigate",
    glyph: "⚙",
  },
];

/** View model for the profile page's link list. */
export interface AgentsMpProfileLinkItem {
  readonly routeId: string;
  readonly label: string;
  readonly url: string;
  readonly mode: AgentsMpNavigationMode;
  readonly glyph: string;
}

export function resolveAgentsMpProfileLinks(
  translate: (key: string) => string,
): AgentsMpProfileLinkItem[] {
  return AGENTS_MP_PROFILE_LINKS.map((entry) => ({
    routeId: entry.routeId,
    label: translate(entry.labelKey),
    url: entry.url,
    mode: entry.mode,
    glyph: entry.glyph,
  }));
}
