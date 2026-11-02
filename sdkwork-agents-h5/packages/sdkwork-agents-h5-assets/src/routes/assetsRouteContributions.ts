/**
 * Assets route contribution. The route id and physical path are owned by the
 * shell package so every client root declares the same identity
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */

import {
  ASSETS_DETAIL_ROUTE_ID,
  ASSETS_LIST_ROUTE_ID,
  ASSETS_PATH,
  type AgentsH5RouteContribution,
} from "@sdkwork/agents-h5-shell";

export const assetsRouteContributions: readonly AgentsH5RouteContribution[] = [
  {
    id: ASSETS_LIST_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "assets",
    screen: "list",
    path: ASSETS_PATH,
    titleKey: "agents.mobile.tab.assets",
    auth: "required",
    permissionHint: "ai.agents.read",
    presentation: { h5Mobile: "tab" },
  },
  {
    id: ASSETS_DETAIL_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "assets",
    screen: "detail",
    path: `${ASSETS_PATH}/:assetId`,
    titleKey: "agents.mobile.assets.detailTitle",
    auth: "required",
    permissionHint: "ai.agents.read",
    presentation: { h5Mobile: "sheet" },
  },
];
