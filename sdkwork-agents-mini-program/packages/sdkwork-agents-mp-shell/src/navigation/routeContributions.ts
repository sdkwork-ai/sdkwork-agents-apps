import {
  AGENTS_MP_ASSETS_DETAIL_PAGE,
  AGENTS_MP_ASSETS_DETAIL_ROUTE_ID,
  AGENTS_MP_ASSETS_LIST_ROUTE_ID,
  AGENTS_MP_ASSETS_PAGE,
  AGENTS_MP_CANVAS_BOARD_ROUTE_ID,
  AGENTS_MP_CANVAS_PAGE,
  AGENTS_MP_CREATIVE_PAGE,
  AGENTS_MP_CREATIVE_STUDIO_ROUTE_ID,
  AGENTS_MP_INSPIRATION_DISCOVER_ROUTE_ID,
  AGENTS_MP_INSPIRATION_PAGE,
  AGENTS_MP_MEMBERSHIP_CATALOG_ROUTE_ID,
  AGENTS_MP_MEMBERSHIP_PAGE,
  AGENTS_MP_PROFILE_INDEX_ROUTE_ID,
  AGENTS_MP_PROFILE_PAGE,
  AGENTS_MP_SETTINGS_INDEX_ROUTE_ID,
  AGENTS_MP_SETTINGS_PAGE,
} from "./routeRegistry";
import type { AgentsMpRouteContribution } from "./routePlacement";

/**
 * Route contributions for the M1 primary surfaces that have no capability
 * package in this root yet plus their profile-hub companions.
 *
 * Route ids and physical page paths live in the shell
 * (`routeRegistry.ts`) so every client root declares the same identity
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7); the capability
 * service behind each page is composed in `src/bootstrap/services.ts`.
 */
export const shellMpRouteContributions: AgentsMpRouteContribution[] = [
  {
    id: AGENTS_MP_INSPIRATION_DISCOVER_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "inspiration",
    screen: "discover",
    titleKey: "agents.mobile.tab.inspiration",
    auth: "required",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_INSPIRATION_PAGE, preload: true },
  },
  {
    id: AGENTS_MP_CREATIVE_STUDIO_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "creative",
    screen: "studio",
    titleKey: "agents.mobile.tab.creative",
    auth: "required",
    permissionHint: "ai.agents.invoke",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_CREATIVE_PAGE, preload: true },
  },
  {
    id: AGENTS_MP_ASSETS_LIST_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "assets",
    screen: "list",
    titleKey: "agents.mobile.tab.assets",
    auth: "required",
    permissionHint: "ai.agents.read",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_ASSETS_PAGE, preload: true },
  },
  {
    id: AGENTS_MP_ASSETS_DETAIL_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "assets",
    screen: "detail",
    titleKey: "agents.mobile.assets.detailTitle",
    auth: "required",
    permissionHint: "ai.agents.read",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_ASSETS_DETAIL_PAGE },
  },
  {
    id: AGENTS_MP_CANVAS_BOARD_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "canvas",
    screen: "board",
    titleKey: "agents.mobile.tab.canvas",
    auth: "required",
    permissionHint: "ai.agents.read",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_CANVAS_PAGE },
  },
  {
    id: AGENTS_MP_MEMBERSHIP_CATALOG_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "membership",
    screen: "catalog",
    titleKey: "agents.mobile.tab.membership",
    auth: "required",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_MEMBERSHIP_PAGE },
  },
  {
    id: AGENTS_MP_PROFILE_INDEX_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "profile",
    screen: "index",
    titleKey: "agents.mobile.tab.profile",
    auth: "required",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_PROFILE_PAGE, preload: true },
  },
  {
    id: AGENTS_MP_SETTINGS_INDEX_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "settings",
    screen: "index",
    titleKey: "agents.mobile.tab.settings",
    auth: "required",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_SETTINGS_PAGE },
  },
];
