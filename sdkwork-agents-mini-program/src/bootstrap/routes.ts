import { agentsMpRouteContributions } from "@sdkwork/agents-mp-agents";
import { automationMpRouteContributions } from "@sdkwork/agents-mp-automation";
import {
  assertAgentsMpRouteContributionsAligned,
  listAgentsMpRootPages,
  projectAgentsMpPages,
  type AgentsMpRouteContribution,
} from "@sdkwork/agents-mp-shell";
import { conversationMpRouteContributions } from "@sdkwork/agents-mp-conversation";
import { libraryMpRouteContributions } from "@sdkwork/agents-mp-library";
import { projectsMpRouteContributions } from "@sdkwork/agents-mp-projects";

/** Subpackage descriptor shape accepted by the mini program `app.json`. */
export interface AgentsMpSubpackageDescriptor {
  readonly root: string;
  readonly pages: string[];
}

/**
 * Assembles every capability route contribution into the root route registry.
 *
 * Capability packages publish contributions; the root assembles them, so no
 * capability depends on a sibling capability
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 4). Alignment is asserted
 * here so a mis-declared id fails fast instead of drifting across clients.
 */
export function createRoutes(): AgentsMpRouteContribution[] {
  const contributions = [
    ...conversationMpRouteContributions,
    ...agentsMpRouteContributions,
    ...libraryMpRouteContributions,
    ...automationMpRouteContributions,
    ...projectsMpRouteContributions,
  ];
  assertAgentsMpRouteContributionsAligned(contributions);
  return contributions;
}

/** Root-package page paths projected from the route contributions. */
export function listRootPages(routes: readonly AgentsMpRouteContribution[]): string[] {
  return listAgentsMpRootPages([...routes]);
}

/**
 * Subpackage descriptors projected from the route contributions.
 *
 * Mini program `subPackages[].root` has no trailing slash and `pages` entries are
 * relative to that root, so a contribution's `pagePath` is already the relative
 * entry and the on-disk page is `<subpackage>/<pagePath>`
 * (`MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md` section 5).
 */
export function listSubpackages(
  routes: readonly AgentsMpRouteContribution[],
): AgentsMpSubpackageDescriptor[] {
  const byRoot = new Map<string, string[]>();
  for (const entry of projectAgentsMpPages([...routes])) {
    if (entry.rootPackage || !entry.subpackage) {
      continue;
    }
    const pages = byRoot.get(entry.subpackage) ?? [];
    pages.push(entry.pagePath);
    byRoot.set(entry.subpackage, pages);
  }
  return [...byRoot.entries()].map(([root, pages]) => ({ root, pages }));
}
