/**
 * Mini program route placement metadata and projection inputs.
 *
 * Authority: `MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md` section 5. SDKWork
 * packages are source/dependency boundaries; platform `subpackages` are
 * runtime loading and package-size boundaries. Build tooling projects route
 * contributions into root pages and subpackages.
 */
export interface MiniProgramRoutePlacement {
  readonly rootPackage?: boolean;
  readonly subpackage?: string;
  readonly pagePath: string;
  readonly preload?: boolean;
}

export interface AgentsMpRouteContribution {
  readonly id: string;
  readonly surface: "app";
  readonly domain: string;
  readonly capability: string;
  readonly screen: string;
  readonly titleKey: string;
  readonly auth: "public" | "required";
  readonly permissionHint?: string;
  readonly miniProgram: MiniProgramRoutePlacement;
}

export interface AgentsMpPageProjectionEntry {
  readonly pagePath: string;
  readonly rootPackage: boolean;
  readonly subpackage?: string;
}

/**
 * Projects route contributions into the mini program `pages` list and
 * `subPackages` descriptor. Route contributions stay the single source; the
 * physical page files are projection targets.
 */
export function projectAgentsMpPages(routes: AgentsMpRouteContribution[]): AgentsMpPageProjectionEntry[] {
  return routes.map((route) => ({
    pagePath: route.miniProgram.pagePath,
    rootPackage: route.miniProgram.rootPackage === true,
    subpackage: route.miniProgram.subpackage,
  }));
}

export function listAgentsMpRootPages(routes: AgentsMpRouteContribution[]): string[] {
  return projectAgentsMpPages(routes)
    .filter((entry) => entry.rootPackage)
    .map((entry) => entry.pagePath);
}
