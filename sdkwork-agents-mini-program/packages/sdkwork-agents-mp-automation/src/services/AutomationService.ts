import { type SdkworkAgentsAppClient } from "@sdkwork/agents-mp-core/sdk";

import {
  type AgentsMpTaskPage,
  type AgentsMpTaskSummary,
  type AgentsMpTasksListing,
} from "../types/automationModels";

/**
 * Automation orchestration.
 *
 * The Agents app API scopes scheduled tasks to one managed agent
 * (`/ai/agents/{agentId}/tasks`), so the tab aggregates the caller's own agents
 * with a bounded fan-out and memoizes the result for the tab's lifetime. The
 * agent id source is injected — this package never depends on a sibling
 * capability package (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 5).
 */

export const AGENTS_MP_AUTOMATION_AGENT_FANOUT = 10;
export const AGENTS_MP_AUTOMATION_TASK_PAGE_SIZE = 20;
export const AGENTS_MP_AUTOMATION_PAGE_SIZE = 20;
export const AGENTS_MP_AUTOMATION_MAX_PAGES = 5;
const CACHE_TTL_MS = 30_000;

/** Raw task record shape; kept structural because the transport DTO is generator-owned. */
export interface AgentsMpRawTaskRecord {
  readonly taskId?: string;
  readonly id?: string;
  readonly title?: string | null;
  readonly prompt?: string;
  readonly status?: string;
  readonly scheduleKind?: string;
  readonly cronExpression?: string | null;
  readonly scheduledAt?: string | null;
  readonly updatedAt?: string;
}

/** Supplies the managed agent ids whose tasks belong to the caller. */
export interface AgentsMpAutomationAgentSource {
  listManagedAgentIds(limit: number): Promise<string[]>;
}

export function describeAgentsMpTaskSchedule(record: AgentsMpRawTaskRecord): string | undefined {
  if (record.scheduleKind === "cron" && record.cronExpression) {
    return record.cronExpression;
  }
  if (record.scheduledAt) {
    return record.scheduledAt;
  }
  return undefined;
}

export function mapAgentsMpTaskSummary(
  record: AgentsMpRawTaskRecord | null | undefined,
): AgentsMpTaskSummary | null {
  if (!record || typeof record !== "object") {
    return null;
  }
  const id = record.taskId ?? record.id;
  if (typeof id !== "string" || id.length === 0) {
    return null;
  }
  const prompt = typeof record.prompt === "string" ? record.prompt : "";
  const title = typeof record.title === "string" && record.title.length > 0 ? record.title : null;
  const schedule = describeAgentsMpTaskSchedule(record);
  return {
    id,
    name: title ?? prompt.slice(0, 60),
    ...(record.status ? { status: String(record.status) } : {}),
    ...(schedule ? { schedule } : {}),
    ...(record.updatedAt ? { updatedAt: record.updatedAt } : {}),
  };
}

export function filterAgentsMpTasks(
  items: readonly AgentsMpTaskSummary[],
  query: string,
): AgentsMpTaskSummary[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...items];
  }
  return items.filter((item) => item.name.toLowerCase().includes(needle));
}

export interface AgentsMpAutomationService {
  listTasks(page?: number, pageSize?: number): Promise<AgentsMpTaskPage>;
  /**
   * Drains the aggregate up to `AGENTS_MP_AUTOMATION_MAX_PAGES` for a tab that
   * shows the whole list at once. Not a batch/export helper
   * (`PAGINATION_SPEC.md`).
   */
  loadTasks(): Promise<AgentsMpTasksListing>;
  /** Test-only reset for the memoized aggregation. */
  resetCache(): void;
}

export function createAgentsMpAutomationService(
  client: SdkworkAgentsAppClient,
  agentSource: AgentsMpAutomationAgentSource,
): AgentsMpAutomationService {
  let cache: { expiresAt: number; tasks: AgentsMpTaskSummary[] } | null = null;

  const collect = async (): Promise<AgentsMpTaskSummary[]> => {
    const now = Date.now();
    if (cache && cache.expiresAt > now) {
      return cache.tasks;
    }

    const agentIds = await agentSource.listManagedAgentIds(AGENTS_MP_AUTOMATION_AGENT_FANOUT);
    const settled = await Promise.allSettled(
      agentIds.map(async (agentId) => {
        const response = await client.ai.agents.tasks.list(agentId, {
          pageSize: AGENTS_MP_AUTOMATION_TASK_PAGE_SIZE,
        });
        return (response.items as AgentsMpRawTaskRecord[])
          .map(mapAgentsMpTaskSummary)
          .filter((task): task is AgentsMpTaskSummary => task !== null);
      }),
    );

    const failures = settled.filter((entry) => entry.status === "rejected");
    if (agentIds.length > 0 && failures.length === settled.length) {
      // Every agent failed: surface the first reason instead of a silently
      // empty tab.
      throw (failures[0] as PromiseRejectedResult).reason;
    }

    const tasks = settled.flatMap((entry) =>
      entry.status === "fulfilled" ? entry.value : [],
    );
    tasks.sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""));
    cache = { expiresAt: now + CACHE_TTL_MS, tasks };
    return tasks;
  };

  return {
    async listTasks(page = 1, pageSize = AGENTS_MP_AUTOMATION_PAGE_SIZE) {
      const tasks = await collect();
      const start = (page - 1) * pageSize;
      return {
        items: tasks.slice(start, start + pageSize),
        page,
        hasMore: start + pageSize < tasks.length,
      };
    },

    async loadTasks() {
      const collected: AgentsMpTaskSummary[] = [];
      for (let page = 1; page <= AGENTS_MP_AUTOMATION_MAX_PAGES; page += 1) {
        const tasks = await collect();
        const start = (page - 1) * AGENTS_MP_AUTOMATION_PAGE_SIZE;
        collected.push(...tasks.slice(start, start + AGENTS_MP_AUTOMATION_PAGE_SIZE));
        if (start + AGENTS_MP_AUTOMATION_PAGE_SIZE >= tasks.length) {
          return { items: collected, truncated: false };
        }
      }
      return { items: collected, truncated: true };
    },

    resetCache() {
      cache = null;
    },
  };
}
