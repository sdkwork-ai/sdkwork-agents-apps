/**
 * Settings route contribution. The route id and physical path are owned by the
 * shell package so every client root declares the same identity
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */

import {
  SETTINGS_INDEX_ROUTE_ID,
  SETTINGS_PATH,
  type AgentsH5RouteContribution,
} from "@sdkwork/agents-h5-shell";

export const settingsRouteContributions: readonly AgentsH5RouteContribution[] = [
  {
    id: SETTINGS_INDEX_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "settings",
    screen: "index",
    path: SETTINGS_PATH,
    titleKey: "agents.mobile.tab.settings",
    auth: "required",
    presentation: { h5Mobile: "stack" },
  },
];
