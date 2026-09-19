/**
 * Automation domain types for the Agents mobile surfaces.
 *
 * An automation entry is an Agents scheduled task: a durable task definition the
 * platform materializes into task runs (`AGENTS_DOMAIN_SPEC.md`). The task is
 * scoped to a managed agent, so the injected port — not this package — decides
 * which agent the listing belongs to.
 */

export interface AutomationTaskSummary {
  id: string;
  name: string;
  /** `active` / `paused` / `completed` / `cancelled` per the Agents task API. */
  status?: string;
  /** Human-readable schedule expression, when the record carries one. */
  schedule?: string;
  /** ISO timestamp. */
  updatedAt?: string;
}

export interface AutomationTaskPage {
  items: AutomationTaskSummary[];
  page: number;
  hasMore: boolean;
}
