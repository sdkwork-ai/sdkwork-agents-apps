/**
 * Canonical route identities for the SDKWork Agents HarmonyOS mobile root.
 *
 * Authority: `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7 (route
 * identity `<surface>.<domain>.<capability>.<screen>`) and
 * `specs/client-page-parity.spec.json` (`clients.harmony`, `pages[]`).
 *
 * The literals below are the single typed source of truth for this root. The
 * page registry in
 * `packages/sdkwork-agents-harmony-mobile-agents/src/main/ets/routes/RouteContributions.ets`
 * is the contract-declared registry file and must carry the same literals;
 * `tests/harmony-surface-contract.test.mjs` fails when the two drift apart.
 *
 * Route ids never encode physical page paths, HTTP paths, SDK methods, or
 * transport details.
 */

// --- M1: PC-primary surfaces ------------------------------------------------

/** Chat workbench (bottom tab 1). */
export const CONVERSATION_CHAT_ROUTE_ID: string = 'app.agents.conversation.chat';

/** Agent catalog / workspace (bottom tab 5). */
export const AGENT_CATALOG_LIST_ROUTE_ID: string = 'app.agents.catalog.list';

/** Inspiration discover feed (bottom tab 2). */
export const INSPIRATION_DISCOVER_ROUTE_ID: string = 'app.agents.inspiration.discover';

/** Generation studio (bottom tab 3). */
export const CREATIVE_STUDIO_ROUTE_ID: string = 'app.agents.creative.studio';

/** Asset library (bottom tab 4). */
export const ASSETS_LIST_ROUTE_ID: string = 'app.agents.assets.list';

/** Membership catalog and checkout entry (profile surface). */
export const MEMBERSHIP_CATALOG_ROUTE_ID: string = 'app.agents.membership.catalog';

/** User profile hub, reachable from the avatar action on every tab. */
export const PROFILE_INDEX_ROUTE_ID: string = 'app.agents.profile.index';

// --- M2: secondary and nested surfaces --------------------------------------

/** Conversation history. */
export const CONVERSATION_LIST_ROUTE_ID: string = 'app.agents.conversation.list';

/** Agent create/edit. */
export const AGENT_CATALOG_EDITOR_ROUTE_ID: string = 'app.agents.catalog.editor';

/** Asset detail sheet. */
export const ASSETS_DETAIL_ROUTE_ID: string = 'app.agents.assets.detail';

/** Canvas board (viewport-constrained on phones). */
export const CANVAS_BOARD_ROUTE_ID: string = 'app.agents.canvas.board';

/** Project list. */
export const PROJECTS_LIST_ROUTE_ID: string = 'app.agents.projects.list';

/** File library. */
export const LIBRARY_LIST_ROUTE_ID: string = 'app.agents.library.list';

/** Settings. */
export const SETTINGS_INDEX_ROUTE_ID: string = 'app.agents.settings.index';

/** Automation schedules (mobile-only surface; no PC entry). */
export const AUTOMATION_INDEX_ROUTE_ID: string = 'app.agents.automation.index';

/**
 * Every route id this root declares, in contract declaration order.
 *
 * The order follows `specs/client-page-parity.spec.json` `pages[]` so a review
 * can diff the registry against the contract without re-sorting.
 */
export const AGENTS_HARMONY_ROUTE_IDS: string[] = [
  CONVERSATION_CHAT_ROUTE_ID,
  AGENT_CATALOG_LIST_ROUTE_ID,
  INSPIRATION_DISCOVER_ROUTE_ID,
  CREATIVE_STUDIO_ROUTE_ID,
  ASSETS_LIST_ROUTE_ID,
  MEMBERSHIP_CATALOG_ROUTE_ID,
  PROFILE_INDEX_ROUTE_ID,
  CONVERSATION_LIST_ROUTE_ID,
  AGENT_CATALOG_EDITOR_ROUTE_ID,
  ASSETS_DETAIL_ROUTE_ID,
  CANVAS_BOARD_ROUTE_ID,
  PROJECTS_LIST_ROUTE_ID,
  LIBRARY_LIST_ROUTE_ID,
  SETTINGS_INDEX_ROUTE_ID,
  AUTOMATION_INDEX_ROUTE_ID,
];
