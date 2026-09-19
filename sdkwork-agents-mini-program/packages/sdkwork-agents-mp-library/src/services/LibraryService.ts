import {
  CHAT_FILE_LIBRARY_PROPERTY_KEY,
  type SdkworkAgentsMpDriveAppClient,
} from "@sdkwork/agents-mp-core/sdk";

import { type AgentsMpLibraryFile, type AgentsMpLibraryPage } from "../types/libraryModels";

/**
 * Agents file-library orchestration.
 *
 * The library is Drive-owned: this service reads nodes carrying the shared
 * library property and never mutates them. The Drive client is injected by the
 * hosting page (`MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md` section 4).
 */

const DEFAULT_PAGE_SIZE = 100;

/** Raw Drive node shape; kept structural because the transport DTO is generator-owned. */
export interface AgentsMpRawDriveNode {
  readonly id?: string;
  readonly nodeName?: string;
  readonly contentType?: string;
  readonly contentLength?: string;
  readonly updatedAt?: string;
  readonly spaceId?: string;
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as Record<string, unknown>;
  const status = record.status ?? record.statusCode ?? record.httpStatus;
  if (status === 404 || status === "404") {
    return true;
  }
  if (record.code === "NOT_FOUND" || record.code === 40401) {
    return true;
  }
  const problem = record.problem as Record<string, unknown> | undefined;
  return problem?.status === 404 || problem?.status === "404" || problem?.code === 40401;
}

export function mapAgentsMpLibraryFile(
  node: AgentsMpRawDriveNode,
): AgentsMpLibraryFile | null {
  if (typeof node.id !== "string" || node.id.length === 0) {
    return null;
  }
  return {
    id: node.id,
    name: node.nodeName ?? node.id,
    ...(node.contentType ? { mimeType: node.contentType } : {}),
    ...(node.contentLength ? { sizeBytes: node.contentLength } : {}),
    ...(node.updatedAt ? { updatedAt: node.updatedAt } : {}),
    ...(node.spaceId ? { spaceId: node.spaceId } : {}),
  };
}

export function filterAgentsMpLibraryFiles(
  files: readonly AgentsMpLibraryFile[],
  query: string,
): AgentsMpLibraryFile[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...files];
  }
  return files.filter((file) => file.name.toLowerCase().includes(needle));
}

export interface AgentsMpLibraryService {
  listFiles(pageSize?: number, cursor?: string): Promise<AgentsMpLibraryPage>;
  /** Short-lived download URL used to open a file. */
  resolvePreviewUrl(nodeId: string): Promise<string>;
}

export function createAgentsMpLibraryService(
  client: SdkworkAgentsMpDriveAppClient,
): AgentsMpLibraryService {
  return {
    async listFiles(pageSize = DEFAULT_PAGE_SIZE, cursor) {
      try {
        const result = await client.drive.propertyNodes.list(CHAT_FILE_LIBRARY_PROPERTY_KEY, {
          pageSize: String(pageSize),
          ...(cursor ? { cursor } : {}),
        });
        const items = (result.items as AgentsMpRawDriveNode[])
          .map(mapAgentsMpLibraryFile)
          .filter((file): file is AgentsMpLibraryFile => file !== null);
        return { items, nextCursor: result.pageInfo.nextCursor ?? null };
      } catch (error) {
        // The library property may not be provisioned for a caller yet; an
        // empty library must render as empty instead of failing the page.
        if (isNotFoundError(error)) {
          return { items: [], nextCursor: null };
        }
        throw error;
      }
    },

    async resolvePreviewUrl(nodeId) {
      const response = await client.drive.nodes.downloadUrls.retrieve(nodeId, {
        requestedTtlSeconds: 900,
      });
      return response.downloadUrl;
    },
  };
}
