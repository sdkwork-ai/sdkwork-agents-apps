import {
  AGENT_CATALOG_LIST_ROUTE_ID,
  ASSETS_LIST_ROUTE_ID,
  CONVERSATION_CHAT_ROUTE_ID,
  CREATIVE_STUDIO_ROUTE_ID,
  INSPIRATION_DISCOVER_ROUTE_ID,
  PROFILE_INDEX_ROUTE_ID,
} from './RouteIds';

/**
 * Page/route stack assembly for the HarmonyOS shell.
 *
 * Authority: `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 8 (route
 * contributions) and `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7
 * (route identity). Route ids follow `<surface>.<domain>.<capability>.<screen>`;
 * physical Harmony page paths may differ from other platforms while route ids
 * stay aligned.
 *
 * Route metadata must not declare HTTP paths, SDK methods, tokens, or raw URL
 * constants.
 */

export type AgentsHarmonyRouteAuth = 'public' | 'required';

/** Presentation intent for this root (`harmonyNative` in the alignment spec). */
export type AgentsHarmonyRoutePresentation = 'tab' | 'page' | 'sheet';

/**
 * Delivery state of the physical screen behind a route id.
 *
 * `pending` keeps the route id contract-complete (M2 ids stay registered) while
 * the navigator refuses to open a screen that has no page yet. This is the
 * mechanism that stops a profile link from silently landing on a blank page.
 */
export type AgentsHarmonyPageStatus = 'delivered' | 'pending';

export interface AgentsHarmonyRouteRegistration {
  readonly id: string;
  readonly surface: 'app';
  readonly domain: 'agents';
  readonly capability: string;
  readonly screen: string;
  /** Harmony page path, relative to the owning module's `ets/` root. */
  readonly pagePath: string;
  readonly titleKey: string;
  readonly auth: AgentsHarmonyRouteAuth;
  readonly permissionHint?: string;
  readonly presentation: AgentsHarmonyRoutePresentation;
  readonly pageStatus: AgentsHarmonyPageStatus;
}

/** Stable tab identifiers shared by every mobile root. */
export type AgentsHarmonyTabId = 'chat' | 'inspiration' | 'creative' | 'assets' | 'agents';

export interface AgentsHarmonyTabDescriptor {
  readonly tab: AgentsHarmonyTabId;
  /** Route identity behind this tab (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7). */
  readonly routeId: string;
  /** i18n key for the tab label. */
  readonly labelKey: string;
}

/**
 * The five PC-primary surfaces every mobile root exposes as bottom tabs, in
 * contract order (`specs/client-page-parity.spec.json`
 * `navigation.mobileBottomTabs`).
 */
export const AGENTS_HARMONY_MOBILE_TABS: AgentsHarmonyTabDescriptor[] = [
  {
    tab: 'chat',
    routeId: CONVERSATION_CHAT_ROUTE_ID,
    labelKey: 'agents.mobile.tab.tasks',
  },
  {
    tab: 'inspiration',
    routeId: INSPIRATION_DISCOVER_ROUTE_ID,
    labelKey: 'agents.mobile.tab.inspiration',
  },
  {
    tab: 'creative',
    routeId: CREATIVE_STUDIO_ROUTE_ID,
    labelKey: 'agents.mobile.tab.creative',
  },
  {
    tab: 'assets',
    routeId: ASSETS_LIST_ROUTE_ID,
    labelKey: 'agents.mobile.tab.assets',
  },
  {
    tab: 'agents',
    routeId: AGENT_CATALOG_LIST_ROUTE_ID,
    labelKey: 'agents.mobile.tab.experts',
  },
];

/** Avatar entry shared by every tab (`navigation.mobileProfileEntry`). */
export const AGENTS_HARMONY_PROFILE_ENTRY_ROUTE_ID: string = PROFILE_INDEX_ROUTE_ID;

/**
 * Profile-hub links, in contract order (`navigation.mobileProfileLinks`).
 *
 * M2 ids stay listed so the hub keeps the full PC page inventory reachable as
 * pages land; the navigator reports which of them are not mounted yet.
 */
export const AGENTS_HARMONY_PROFILE_LINK_ROUTE_IDS: string[] = [
  'app.agents.membership.catalog',
  'app.agents.projects.list',
  'app.agents.library.list',
  'app.agents.automation.index',
  'app.agents.conversation.list',
  'app.agents.settings.index',
];

function idSegments(id: string): string[] {
  return id.split('.');
}

/**
 * Verifies `id === [surface, domain, capability, screen].join('.')`.
 */
export function isAlignedAgentsHarmonyRoute(route: AgentsHarmonyRouteRegistration): boolean {
  return route.id === [route.surface, route.domain, route.capability, route.screen].join('.');
}

/**
 * Assembles and validates the shell route stack.
 *
 * Failures are programming errors in composition (an unaligned id, a duplicate
 * id, or an empty page path), so they throw instead of degrading at runtime.
 */
export function createAgentsHarmonyRouteStack(
  routes: AgentsHarmonyRouteRegistration[],
): AgentsHarmonyRouteRegistration[] {
  const seen: string[] = [];
  for (const route of routes) {
    if (route.pagePath.trim().length === 0) {
      throw new Error(`Harmony route ${route.id} must declare a page path`);
    }
    if (!isAlignedAgentsHarmonyRoute(route)) {
      throw new Error(`Harmony route id is not aligned with its segments: ${route.id}`);
    }
    if (seen.includes(route.id)) {
      throw new Error(`Duplicate Harmony route id: ${route.id}`);
    }
    seen.push(route.id);
  }
  return routes;
}

/** Resolves a registration by canonical route id. */
export function findAgentsHarmonyRoute(
  routes: AgentsHarmonyRouteRegistration[],
  routeId: string,
): AgentsHarmonyRouteRegistration | null {
  for (const route of routes) {
    if (route.id === routeId) {
      return route;
    }
  }
  return null;
}

/**
 * True when the route id resolves to a screen this shell can actually open.
 *
 * Tab routes are hosted inside the tab container, not pushed as pages, so they
 * are not router destinations. `pending` M2 routes stay registered but are not
 * openable yet.
 */
export function canOpenAgentsHarmonyRoute(
  routes: AgentsHarmonyRouteRegistration[],
  routeId: string,
): boolean {
  const route = findAgentsHarmonyRoute(routes, routeId);
  if (route === null) {
    return false;
  }
  return route.pageStatus === 'delivered' && route.presentation !== 'tab';
}

/** Resolves the tab that owns a route id, or `null` for stack surfaces. */
export function resolveAgentsHarmonyTabByRouteId(
  routeId: string,
): AgentsHarmonyTabDescriptor | null {
  for (const descriptor of AGENTS_HARMONY_MOBILE_TABS) {
    if (descriptor.routeId === routeId) {
      return descriptor;
    }
  }
  return null;
}

/** Tab index for a route id; `0` (chat) when the id is not a tab route. */
export function resolveAgentsHarmonyTabIndex(routeId: string): number {
  for (let index = 0; index < AGENTS_HARMONY_MOBILE_TABS.length; index += 1) {
    if (AGENTS_HARMONY_MOBILE_TABS[index].routeId === routeId) {
      return index;
    }
  }
  return 0;
}

/** Route id behind a tab index, falling back to the chat tab. */
export function resolveAgentsHarmonyTabRouteId(index: number): string {
  if (index < 0 || index >= AGENTS_HARMONY_MOBILE_TABS.length) {
    return AGENTS_HARMONY_MOBILE_TABS[0].routeId;
  }
  return AGENTS_HARMONY_MOBILE_TABS[index].routeId;
}

/** Human-orderable capability/screen pair used by diagnostics and tests. */
export function describeAgentsHarmonyRoute(route: AgentsHarmonyRouteRegistration): string {
  return `${idSegments(route.id).slice(2).join('.')} -> ${route.pagePath}`;
}
