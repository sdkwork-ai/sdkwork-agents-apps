import { type AgentsMpRouteContribution } from "@sdkwork/agents-mp-shell";

/**
 * Route contributions for the agents capability.
 *
 * Route ids follow `<surface>.<domain>.<capability>.<screen>` and stay aligned
 * with the PC, H5, and HarmonyOS roots. Route metadata must not declare HTTP
 * API paths, SDK methods, raw URL constants, or transport details.
 */
export const agentsMpRouteContributions: AgentsMpRouteContribution[] = [
  {
    id: "app.agents.catalog.list",
    surface: "app",
    domain: "agents",
    capability: "catalog",
    screen: "list",
    titleKey: "agents.catalog.title",
    auth: "required",
    permissionHint: "agents.agents.read",
    miniProgram: { rootPackage: true, pagePath: "pages/agents/index" },
  },
  {
    id: "app.agents.catalog.editor",
    surface: "app",
    domain: "agents",
    capability: "catalog",
    screen: "editor",
    titleKey: "agents.catalog.title",
    auth: "required",
    permissionHint: "agents.agents.write",
    miniProgram: { rootPackage: true, pagePath: "pages/agents-h5/index" },
  },
];
