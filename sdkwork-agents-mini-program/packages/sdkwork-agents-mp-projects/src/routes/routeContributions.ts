import {
  AGENTS_MP_PROJECTS_LIST_ROUTE_ID,
  AGENTS_MP_PROJECTS_PAGE,
  type AgentsMpRouteContribution,
} from "@sdkwork/agents-mp-shell";

/**
 * Projects route contribution. Route ids and page paths are owned by the
 * shell package so every client root declares the same identity
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */
export const projectsMpRouteContributions: AgentsMpRouteContribution[] = [
  {
    id: AGENTS_MP_PROJECTS_LIST_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "projects",
    screen: "list",
    titleKey: "agents.projects.title",
    auth: "required",
    permissionHint: "ai.agents.read",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_PROJECTS_PAGE },
  },
];
