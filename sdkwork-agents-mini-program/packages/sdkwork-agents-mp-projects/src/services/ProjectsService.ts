import { type SdkworkAgentsAppClient } from "@sdkwork/agents-mp-core/sdk";

import {
  type AgentsMpProjectPage,
  type AgentsMpProjectSummary,
  type AgentsMpProjectsListing,
} from "../types/projectsModels";

/**
 * Projects orchestration.
 *
 * The SDK client is injected by the hosting page
 * (`MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md` section 4); this service maps records
 * and interprets pagination only and never constructs transport.
 *
 * Authority: `PAGINATION_SPEC.md` — `/ai/projects` is an offset listing.
 */

export const AGENTS_MP_PROJECTS_PAGE_SIZE = 20;
export const AGENTS_MP_PROJECTS_MAX_PAGES = 5;

/**
 * Raw project record shape as returned by the generated app SDK list operation.
 * Kept structural because the transport DTO is generator-owned.
 */
export interface AgentsMpRawProjectRecord {
  readonly projectId?: string;
  readonly id?: string;
  readonly name?: string;
  readonly description?: string | null;
  readonly status?: string;
  readonly updatedAt?: string;
}

export function mapAgentsMpProjectSummary(
  record: AgentsMpRawProjectRecord | null | undefined,
): AgentsMpProjectSummary | null {
  if (!record || typeof record !== "object") {
    return null;
  }
  const id = record.projectId ?? record.id;
  if (typeof id !== "string" || id.length === 0) {
    return null;
  }
  const name = record.name;
  return {
    id,
    name: typeof name === "string" && name.length > 0 ? name : id,
    ...(record.description ? { description: record.description } : {}),
    ...(record.status ? { status: String(record.status) } : {}),
    ...(record.updatedAt ? { updatedAt: record.updatedAt } : {}),
  };
}

export function filterAgentsMpProjects(
  items: readonly AgentsMpProjectSummary[],
  query: string,
): AgentsMpProjectSummary[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...items];
  }
  return items.filter((item) => item.name.toLowerCase().includes(needle));
}

/** Interprets the offset `pageInfo` envelope of `/ai/projects`. */
export function resolveAgentsMpProjectHasMore(pageInfo: unknown): boolean {
  if (!pageInfo || typeof pageInfo !== "object") {
    return false;
  }
  const info = pageInfo as { page?: unknown; totalPages?: unknown; hasMore?: unknown };
  if (info.hasMore === true) {
    return true;
  }
  const page = Number(info.page ?? 1);
  const totalPages = Number(info.totalPages ?? 0);
  return Number.isFinite(page) && Number.isFinite(totalPages) && totalPages > 0 && page < totalPages;
}

export interface AgentsMpProjectsService {
  listProjects(page?: number, pageSize?: number): Promise<AgentsMpProjectPage>;
  /**
   * Drains the listing up to `AGENTS_MP_PROJECTS_MAX_PAGES` for a tab that
   * shows the whole list at once. Not a batch/export helper
   * (`PAGINATION_SPEC.md`).
   */
  loadProjects(): Promise<AgentsMpProjectsListing>;
}

export function createAgentsMpProjectsService(
  client: SdkworkAgentsAppClient,
): AgentsMpProjectsService {
  const readPage = async (page: number, pageSize: number): Promise<AgentsMpProjectPage> => {
    const response = await client.ai.agents.projects.list({ page, pageSize });
    const items = (response.items as AgentsMpRawProjectRecord[])
      .map(mapAgentsMpProjectSummary)
      .filter((item): item is AgentsMpProjectSummary => item !== null);
    return { items, page, hasMore: resolveAgentsMpProjectHasMore(response.pageInfo) };
  };

  return {
    listProjects(page = 1, pageSize = AGENTS_MP_PROJECTS_PAGE_SIZE) {
      return readPage(page, pageSize);
    },

    async loadProjects() {
      const collected: AgentsMpProjectSummary[] = [];
      for (let page = 1; page <= AGENTS_MP_PROJECTS_MAX_PAGES; page += 1) {
        const result = await readPage(page, AGENTS_MP_PROJECTS_PAGE_SIZE);
        collected.push(...result.items);
        if (!result.hasMore) {
          return { items: collected, truncated: false };
        }
      }
      return { items: collected, truncated: true };
    },
  };
}
