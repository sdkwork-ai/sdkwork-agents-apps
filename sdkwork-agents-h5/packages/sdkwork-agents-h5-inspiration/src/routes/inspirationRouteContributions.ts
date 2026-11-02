/**
 * Inspiration route contribution. The route id and physical path are owned by
 * the shell package so every client root declares the same identity
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */

import {
  INSPIRATION_DISCOVER_ROUTE_ID,
  INSPIRATION_PATH,
  type AgentsH5RouteContribution,
} from "@sdkwork/agents-h5-shell";

export const inspirationRouteContributions: readonly AgentsH5RouteContribution[] = [
  {
    id: INSPIRATION_DISCOVER_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "inspiration",
    screen: "discover",
    path: INSPIRATION_PATH,
    titleKey: "agents.mobile.tab.inspiration",
    auth: "required",
    presentation: { h5Mobile: "tab" },
  },
];
