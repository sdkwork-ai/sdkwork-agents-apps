/**
 * Automation route contributions. Route ids are owned by the shell package.
 */

import {
  AUTOMATION_INDEX_ROUTE_ID,
  AUTOMATION_PATH,
  type AgentsH5RouteContribution,
} from "@sdkwork/agents-h5-shell";

export const automationRouteContributions: readonly AgentsH5RouteContribution[] = [
  {
    id: AUTOMATION_INDEX_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "automation",
    screen: "index",
    path: AUTOMATION_PATH,
    titleKey: "agents.automation.title",
    auth: "required",
    permissionHint: "ai.agents.read",
    presentation: { h5Mobile: "tab" },
  },
];
