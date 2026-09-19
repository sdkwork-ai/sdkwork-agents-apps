import {
  AGENTS_MP_AGENT_EDITOR_PAGE,
  AGENTS_MP_CATALOG_EDITOR_ROUTE_ID,
  AGENTS_MP_CATALOG_LIST_ROUTE_ID,
  AGENTS_MP_EXPERTS_PAGE,
  type AgentsMpRouteContribution,
} from "@sdkwork/agents-mp-shell";

/**
 * Route contributions for the agents capability.
 *
 * Route ids follow `<surface>.<domain>.<capability>.<screen>` and stay aligned
 * with the PC, H5, Flutter, and HarmonyOS roots. Ids and page paths are owned by
 * the shell package so no capability re-declares them as string literals. Route
 * metadata must not declare HTTP API paths, SDK methods, raw URL constants, or
 * transport details.
 */
export const agentsMpRouteContributions: AgentsMpRouteContribution[] = [
  {
    id: AGENTS_MP_CATALOG_LIST_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "catalog",
    screen: "list",
    titleKey: "agents.catalog.title",
    auth: "required",
    permissionHint: "agents.agents.read",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_EXPERTS_PAGE },
  },
  {
    id: AGENTS_MP_CATALOG_EDITOR_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "catalog",
    screen: "editor",
    titleKey: "agents.catalog.title",
    auth: "required",
    permissionHint: "agents.agents.write",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_AGENT_EDITOR_PAGE },
  },
];
