/**
 * Automation domain models for the Agents mini program.
 *
 * An automation entry is an Agents scheduled task: a durable task definition the
 * platform materializes into task runs (`AGENTS_DOMAIN_SPEC.md`). The task API is
 * scoped to one managed agent, so the listing is an aggregate across the caller's
 * own agents and carries a truncation flag.
 */

export interface AgentsMpTaskSummary {
  readonly id: string;
  readonly name: string;
  /** `active` / `paused` / `completed` / `cancelled` per the Agents task API. */
  readonly status?: string;
  /** Human-readable schedule expression, when the record carries one. */
  readonly schedule?: string;
  /** ISO timestamp. */
  readonly updatedAt?: string;
}

export interface AgentsMpTaskPage {
  readonly items: AgentsMpTaskSummary[];
  readonly page: number;
  readonly hasMore: boolean;
}

export interface AgentsMpTasksListing {
  readonly items: AgentsMpTaskSummary[];
  /** `true` when the page cap was reached before the aggregate was exhausted. */
  readonly truncated: boolean;
}
