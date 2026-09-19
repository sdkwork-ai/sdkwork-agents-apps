import { getLibraryPort } from "./libraryPort";
import {
  LIBRARY_MAX_PAGES,
  LIBRARY_PAGE_SIZE,
} from "../libraryConstants";
import type { LibraryFile, LibraryPage } from "../types";

/** A library listing that tolerates a tenant without the library provisioned. */
export interface LibraryListing {
  items: LibraryFile[];
  /** True when the drain stopped at the page cap instead of the last page. */
  truncated: boolean;
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as Record<string, unknown>;
  const status = record.status ?? record.statusCode ?? record.httpStatus;
  if (status === 404 || status === "404") {
    return true;
  }
  const problem = record.problem;
  if (problem && typeof problem === "object") {
    const detail = problem as Record<string, unknown>;
    return detail.status === 404 || detail.status === "404" || detail.code === 40401;
  }
  return false;
}

export class LibraryService {
  /**
   * Drains the cursor listing up to the page cap. A missing library property is
   * an empty library, not a failure: the tenant may not have provisioned it yet.
   */
  static async listFiles(): Promise<LibraryListing> {
    const port = getLibraryPort();
    const collected: LibraryFile[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < LIBRARY_MAX_PAGES; page += 1) {
      let result: LibraryPage;
      try {
        result = await port.listFiles(LIBRARY_PAGE_SIZE, cursor);
      } catch (error) {
        if (page === 0 && isNotFound(error)) {
          return { items: [], truncated: false };
        }
        throw error;
      }
      collected.push(...result.items);
      if (!result.nextCursor) {
        return { items: collected, truncated: false };
      }
      cursor = result.nextCursor;
    }
    return { items: collected, truncated: true };
  }

  static async resolvePreviewUrl(nodeId: string): Promise<string> {
    return getLibraryPort().resolvePreviewUrl(nodeId);
  }

  /** Case-insensitive name filter applied on the already-listed page set. */
  static filterByName(items: LibraryFile[], query: string): LibraryFile[] {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return items;
    }
    return items.filter((item) => item.name.toLowerCase().includes(needle));
  }
}
