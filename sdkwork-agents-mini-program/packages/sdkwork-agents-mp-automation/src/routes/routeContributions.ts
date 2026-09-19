import {
  AGENTS_MP_AUTOMATION_INDEX_ROUTE_ID,
  AGENTS_MP_AUTOMATION_PAGE,
  type AgentsMpRouteContribution,
} from "@sdkwork/agents-mp-shell";

/**
 * Automation route contribution. Route ids and page paths are owned by the
 * shell package so every client root declares the same identity
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
 */
export const automationMpRouteContributions: AgentsMpRouteContribution[] = [
  {
    id: AGENTS_MP_AUTOMATION_INDEX_ROUTE_ID,
    surface: "app",
    domain: "agents",
    capability: "automation",
    screen: "index",
    titleKey: "agents.automation.title",
    auth: "required",
    permissionHint: "ai.agents.read",
    miniProgram: { rootPackage: true, pagePath: AGENTS_MP_AUTOMATION_PAGE },
  },
];
