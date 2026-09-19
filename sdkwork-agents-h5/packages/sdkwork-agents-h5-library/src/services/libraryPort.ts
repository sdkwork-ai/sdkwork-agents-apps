/**
 * Library port.
 *
 * The library surface reads Drive-owned file nodes, so the transport lives
 * behind an injected port instead of importing a generated SDK here
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 1 and 8).
 */

import type { LibraryPage } from "../types";

export interface LibraryPort {
  listFiles(pageSize: number, cursor?: string): Promise<LibraryPage>;
  /** Short-lived download URL used to open a file. */
  resolvePreviewUrl(nodeId: string): Promise<string>;
}

let libraryPort: LibraryPort | null = null;

export function configureLibraryPort(port: LibraryPort): void {
  libraryPort = port;
}

export function getLibraryPort(): LibraryPort {
  if (!libraryPort) {
    throw new Error("Library port is not configured.");
  }
  return libraryPort;
}

export function isLibraryPortConfigured(): boolean {
  return libraryPort !== null;
}

/** Test-only reset so isolated unit tests can re-wire the port. */
export function resetLibraryPort(): void {
  libraryPort = null;
}
