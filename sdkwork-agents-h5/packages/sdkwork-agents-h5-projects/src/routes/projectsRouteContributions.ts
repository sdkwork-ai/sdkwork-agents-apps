/**
 * Projects route contributions. Route ids are owned by the shell package.
 */

import {
  PROJECTS_LIST_ROUTE_ID,
  PROJECTS_PATH,
  type AgentsH5RouteContribution,
} from "@sdkwork/agents-h5-shell";

export const projectsRouteContributions: readonly AgentsH5RouteContribution[] = [
  {
    id: PROJECTS_LIST_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "projects",
    screen: "list",
    path: PROJECTS_PATH,
    titleKey: "agents.projects.title",
    auth: "required",
    permissionHint: "ai.agents.read",
    presentation: { h5Mobile: "tab" },
  },
];
