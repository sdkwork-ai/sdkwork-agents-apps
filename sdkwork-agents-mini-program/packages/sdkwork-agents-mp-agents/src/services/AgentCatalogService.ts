import { resolveAgentsMpScreenStatus, type AgentsMpScreenState } from "@sdkwork/agents-mp-commons";
import { type SdkworkAgentsAppClient } from "@sdkwork/agents-mp-core/sdk";

import { type AgentsMpCatalogItem, type AgentsMpCatalogPage } from "../types/agentModels";

/**
 * Agents catalog orchestration.
 *
 * The SDK client is injected by the platform page; this service performs record
 * mapping and pagination interpretation only and never constructs transport.
 *
 * Authority: `MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md` section 4 (`services/`)
 * and `PAGINATION_SPEC.md`.
 */

const DEFAULT_PAGE_SIZE = 20;

/**
 * Raw agent record shape as returned by the generated app SDK list operation.
 * Kept structural because the transport DTO is generator-owned.
 */
export interface AgentsMpRawAgentRecord {
  readonly agentId?: string;
  readonly id?: string;
  readonly code?: string;
  readonly displayName?: string;
  readonly description?: string;
}

export function mapAgentsMpCatalogItem(record: AgentsMpRawAgentRecord | null | undefined): AgentsMpCatalogItem | null {
  if (!record || typeof record !== "object") {
    return null;
  }
  const id = record.agentId ?? record.id ?? record.code;
  if (typeof id !== "string" || id.length === 0) {
    return null;
  }
  const name = record.displayName ?? record.code ?? "Agent";
  return {
    id,
    name: typeof name === "string" ? name : String(name),
    description: typeof record.description === "string" ? record.description : "",
  };
}

export function extractAgentsMpItems(response: unknown): AgentsMpRawAgentRecord[] {
  if (!response || typeof response !== "object") {
    return [];
  }
  const candidate = response as { items?: unknown; data?: { items?: unknown } };
  if (Array.isArray(candidate.items)) {
    return candidate.items as AgentsMpRawAgentRecord[];
  }
  if (candidate.data && Array.isArray(candidate.data.items)) {
    return candidate.data.items as AgentsMpRawAgentRecord[];
  }
  return [];
}

export function resolveAgentsMpHasMore(response: unknown): boolean {
  if (!response || typeof response !== "object") {
    return false;
  }
  const candidate = response as {
    pageInfo?: { page?: unknown; totalPages?: unknown; total_pages?: unknown; hasMore?: unknown };
    data?: { pageInfo?: { page?: unknown; totalPages?: unknown; total_pages?: unknown; hasMore?: unknown } };
  };
  const pageInfo = candidate.pageInfo ?? candidate.data?.pageInfo ?? {};
  if (pageInfo.hasMore === true) {
    return true;
  }
  const page = Number(pageInfo.page ?? 1);
  const totalPages = Number(pageInfo.totalPages ?? pageInfo.total_pages ?? 0);
  return totalPages > 0 && page < totalPages;
}

export interface AgentCatalogService {
  loadPage(page: number, pageSize?: number): Promise<AgentsMpCatalogPage>;
}

export function createAgentCatalogService(client: SdkworkAgentsAppClient): AgentCatalogService {
  return {
    async loadPage(page: number, pageSize: number = DEFAULT_PAGE_SIZE): Promise<AgentsMpCatalogPage> {
      if (!Number.isInteger(page) || page < 1) {
        throw new Error("page must be a positive integer");
      }
      if (!Number.isInteger(pageSize) || pageSize < 1) {
        throw new Error("pageSize must be a positive integer");
      }
      const response = await client.ai.agents.list({ page, pageSize });
      const items = extractAgentsMpItems(response)
        .map(mapAgentsMpCatalogItem)
        .filter((item): item is AgentsMpCatalogItem => item !== null);
      return { items, page, hasMore: resolveAgentsMpHasMore(response) };
    },
  };
}

export function resolveAgentsMpCatalogScreenState(
  itemCount: number,
  loading: boolean,
  errorMessage?: string,
): AgentsMpScreenState {
  return {
    status: resolveAgentsMpScreenStatus(itemCount, loading, errorMessage),
    errorMessage,
  };
}
