/**
 * Profile route contribution. The route id and physical path are owned by the
 * shell package so every client root declares the same identity
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */

import {
  PROFILE_INDEX_ROUTE_ID,
  PROFILE_PATH,
  type AgentsH5RouteContribution,
} from "@sdkwork/agents-h5-shell";

export const profileRouteContributions: readonly AgentsH5RouteContribution[] = [
  {
    id: PROFILE_INDEX_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "profile",
    screen: "index",
    path: PROFILE_PATH,
    titleKey: "agents.mobile.tab.profile",
    auth: "required",
    presentation: { h5Mobile: "stack" },
  },
];
