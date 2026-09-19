/**
 * Library route contributions. Route ids are owned by the shell package so all
 * client roots declare the same identity
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */

import {
  LIBRARY_LIST_ROUTE_ID,
  LIBRARY_PATH,
  type AgentsH5RouteContribution,
} from "@sdkwork/agents-h5-shell";

export const libraryRouteContributions: readonly AgentsH5RouteContribution[] = [
  {
    id: LIBRARY_LIST_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "library",
    screen: "list",
    path: LIBRARY_PATH,
    titleKey: "agents.library.title",
    auth: "required",
    permissionHint: "drive.nodes.read",
    presentation: { h5Mobile: "tab" },
  },
];
