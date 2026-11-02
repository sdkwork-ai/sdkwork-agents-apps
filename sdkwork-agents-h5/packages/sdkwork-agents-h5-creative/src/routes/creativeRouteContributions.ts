/**
 * Creative route contribution. The route id and physical path are owned by the
 * shell package so every client root declares the same identity
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */

import {
  CREATIVE_PATH,
  CREATIVE_STUDIO_ROUTE_ID,
  type AgentsH5RouteContribution,
} from "@sdkwork/agents-h5-shell";

export const creativeRouteContributions: readonly AgentsH5RouteContribution[] = [
  {
    id: CREATIVE_STUDIO_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "creative",
    screen: "studio",
    path: CREATIVE_PATH,
    titleKey: "agents.mobile.tab.creative",
    auth: "required",
    permissionHint: "ai.agents.invoke",
    presentation: { h5Mobile: "tab" },
  },
];
