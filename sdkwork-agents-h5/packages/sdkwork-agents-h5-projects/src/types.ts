/**
 * Projects domain types for the Agents mobile surfaces.
 *
 * A project is the Agents-owned container that groups sessions
 * (`AGENTS_DOMAIN_SPEC.md`); it is not an IM conversation.
 */

export interface AgentProjectSummary {
  id: string;
  name: string;
  description?: string;
  status?: string;
  /** ISO timestamp. */
  updatedAt?: string;
}

export interface AgentProjectPage {
  items: AgentProjectSummary[];
  page: number;
  hasMore: boolean;
}
