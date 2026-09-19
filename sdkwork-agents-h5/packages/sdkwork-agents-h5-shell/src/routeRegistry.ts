/**
 * Canonical H5 route identities for the Agents mobile surface.
 *
 * Authority: `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7 — a route id
 * is `<surface>.<domain>.<capability>.<screen>` and client roots are aligned by
 * route identity, not by identical physical paths. Section 4 assigns route
 * registry and contribution assembly to the shell package.
 *
 * The ids below are the single source of truth for this root. Capability
 * packages import them when they publish route contributions, and `src/` only
 * assembles the screens behind them.
 */

/** Shared route contribution shape (section 7). */
export interface AgentsH5RouteContribution {
  readonly id: string;
  readonly surface: "app";
  readonly domain: "agents";
  readonly capability: string;
  readonly screen: string;
  /** Physical H5 path. May differ from other client roots. */
  readonly path: string;
  readonly titleKey: string;
  readonly auth: "public" | "required";
  readonly permissionHint?: string;
  readonly presentation?: {
    readonly h5Mobile?: "stack" | "tab" | "modal" | "sheet";
  };
}

/** Route ids, aligned across the H5, mini program, Flutter, and Harmony roots. */
export const CONVERSATION_CHAT_ROUTE_ID = "app.agents.conversation.chat" as const;
export const AGENT_CATALOG_LIST_ROUTE_ID = "app.agents.catalog.list" as const;
export const CONVERSATION_LIST_ROUTE_ID = "app.agents.conversation.list" as const;
export const LIBRARY_LIST_ROUTE_ID = "app.agents.library.list" as const;
export const AUTOMATION_INDEX_ROUTE_ID = "app.agents.automation.index" as const;
export const PROJECTS_LIST_ROUTE_ID = "app.agents.projects.list" as const;

/** Physical H5 paths for the mobile surfaces. */
export const CONVERSATION_PATH = "/" as const;
export const CONVERSATION_LIST_PATH = "/conversation/history" as const;
export const EXPERTS_PATH = "/experts" as const;
export const LIBRARY_PATH = "/library" as const;
export const AUTOMATION_PATH = "/automation" as const;
export const PROJECTS_PATH = "/projects" as const;

/**
 * Assembles the root route registry from the contributions published by the
 * capability packages. The composition root calls this so no package has to
 * depend on a sibling capability.
 */
export function assembleAgentsH5RouteRegistry(
  contributions: readonly AgentsH5RouteContribution[],
): readonly AgentsH5RouteContribution[] {
  const seen = new Set<string>();
  for (const contribution of contributions) {
    if (!isAlignedAgentsH5RouteContribution(contribution)) {
      throw new Error(`Route id is not aligned with its segments: ${contribution.id}`);
    }
    if (seen.has(contribution.id)) {
      throw new Error(`Duplicate route id: ${contribution.id}`);
    }
    seen.add(contribution.id);
  }
  return contributions;
}

/**
 * Verifies that a contribution id decomposes into its own segment fields.
 * `id === [surface, domain, capability, screen].join('.')`
 */
export function isAlignedAgentsH5RouteContribution(
  contribution: AgentsH5RouteContribution,
): boolean {
  return (
    contribution.id ===
    [
      contribution.surface,
      contribution.domain,
      contribution.capability,
      contribution.screen,
    ].join(".")
  );
}
