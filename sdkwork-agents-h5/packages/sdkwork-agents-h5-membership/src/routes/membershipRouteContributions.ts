/**
 * Membership route contribution. The route id and physical path are owned by
 * the shell package so every client root declares the same identity
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */

import {
  MEMBERSHIP_CATALOG_ROUTE_ID,
  MEMBERSHIP_PATH,
  type AgentsH5RouteContribution,
} from "@sdkwork/agents-h5-shell";

export const membershipRouteContributions: readonly AgentsH5RouteContribution[] = [
  {
    id: MEMBERSHIP_CATALOG_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "membership",
    screen: "catalog",
    path: MEMBERSHIP_PATH,
    titleKey: "agents.mobile.tab.membership",
    auth: "required",
    presentation: { h5Mobile: "stack" },
  },
];
