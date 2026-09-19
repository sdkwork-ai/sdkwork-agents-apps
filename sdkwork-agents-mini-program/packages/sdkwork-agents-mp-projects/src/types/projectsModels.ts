/**
 * Projects domain models for the Agents mini program.
 *
 * A project is the Agents-owned container that groups sessions
 * (`AGENTS_DOMAIN_SPEC.md`); it is not an IM conversation. API DTOs come from the
 * generated app SDK — this file owns view models only.
 */

export interface AgentsMpProjectSummary {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  /** `active` / `archived` per the Agents project API. */
  readonly status?: string;
  /** ISO timestamp. */
  readonly updatedAt?: string;
}

export interface AgentsMpProjectPage {
  readonly items: AgentsMpProjectSummary[];
  readonly page: number;
  readonly hasMore: boolean;
}

export interface AgentsMpProjectsListing {
  readonly items: AgentsMpProjectSummary[];
  /** `true` when the page cap was reached before the listing was exhausted. */
  readonly truncated: boolean;
}
