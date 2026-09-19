/**
 * Canonical mini program route identities for the Agents mobile surfaces.
 *
 * Authority: `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7 — a route id
 * is `<surface>.<domain>.<capability>.<screen>`, and client roots are aligned by
 * route identity rather than by identical physical paths. The ids below are the
 * same literals the PC and H5 roots declare; only `pagePath` differs, because
 * mini program pages are physical platform files
 * (`MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md` section 5).
 */

/** Route ids, aligned with the PC, H5, Flutter, and Harmony roots. */
export const AGENTS_MP_CONVERSATION_CHAT_ROUTE_ID = "app.agents.conversation.chat" as const;
export const AGENTS_MP_CONVERSATION_LIST_ROUTE_ID = "app.agents.conversation.list" as const;
export const AGENTS_MP_CATALOG_LIST_ROUTE_ID = "app.agents.catalog.list" as const;
export const AGENTS_MP_CATALOG_EDITOR_ROUTE_ID = "app.agents.catalog.editor" as const;
export const AGENTS_MP_LIBRARY_LIST_ROUTE_ID = "app.agents.library.list" as const;
export const AGENTS_MP_AUTOMATION_INDEX_ROUTE_ID = "app.agents.automation.index" as const;
export const AGENTS_MP_PROJECTS_LIST_ROUTE_ID = "app.agents.projects.list" as const;

/** Physical mini program page paths. */
export const AGENTS_MP_CONVERSATION_PAGE = "pages/conversation/index" as const;
export const AGENTS_MP_CONVERSATION_HISTORY_PAGE = "pages/conversation/history" as const;
export const AGENTS_MP_EXPERTS_PAGE = "pages/agents/index" as const;
export const AGENTS_MP_AGENT_EDITOR_PAGE = "pages/agents-h5/index" as const;
export const AGENTS_MP_LIBRARY_PAGE = "pages/library/index" as const;
export const AGENTS_MP_AUTOMATION_PAGE = "pages/automation/index" as const;
export const AGENTS_MP_PROJECTS_PAGE = "pages/projects/index" as const;

/**
 * Verifies that a contribution id decomposes into its own segment fields.
 * `id === [surface, domain, capability, screen].join('.')`
 */
export function isAlignedAgentsMpRouteId(
  id: string,
  segments: {
    readonly surface: string;
    readonly domain: string;
    readonly capability: string;
    readonly screen: string;
  },
): boolean {
  return (
    id === [segments.surface, segments.domain, segments.capability, segments.screen].join(".")
  );
}

/**
 * Validates a contribution list: every id must match its segments and no id may
 * be declared twice. Capability packages publish contributions; the root
 * assembles them, so no package has to depend on a sibling capability.
 */
export function assertAgentsMpRouteContributionsAligned(
  contributions: readonly {
    readonly id: string;
    readonly surface: string;
    readonly domain: string;
    readonly capability: string;
    readonly screen: string;
  }[],
): void {
  const seen = new Set<string>();
  for (const contribution of contributions) {
    if (!isAlignedAgentsMpRouteId(contribution.id, contribution)) {
      throw new Error(`Route id is not aligned with its segments: ${contribution.id}`);
    }
    if (seen.has(contribution.id)) {
      throw new Error(`Duplicate route id: ${contribution.id}`);
    }
    seen.add(contribution.id);
  }
}
