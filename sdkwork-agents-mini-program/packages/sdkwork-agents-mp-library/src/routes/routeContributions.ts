import {
  AGENTS_MP_LIBRARY_LIST_ROUTE_ID,
  AGENTS_MP_LIBRARY_PAGE,
  type AgentsMpRouteContribution,
} from "@sdkwork/agents-mp-shell";

/**
 * Library route contribution. Route ids and page paths are owned by the
 * shell package so every client root declares the same identity
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */
export const libraryMpRouteContributions: AgentsMpRouteContribution[] = [
  {
    id: AGENTS_MP_LIBRARY_LIST_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "library",
    screen: "list",
    titleKey: "agents.library.title",
    auth: "required",
    permissionHint: "drive.nodes.read",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_LIBRARY_PAGE },
  },
];
