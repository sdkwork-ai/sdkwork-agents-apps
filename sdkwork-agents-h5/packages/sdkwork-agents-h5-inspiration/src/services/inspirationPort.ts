import type { InspirationChannel, InspirationItem } from "../types";

/**
 * Transport port for the curated inspiration feed.
 *
 * The application root composes the feeds client and injects this port
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 8). A root that has not
 * composed a feed transport reports that fact instead of rendering invented
 * cards.
 */
export interface InspirationPort {
  loadFeed(channel: InspirationChannel): Promise<InspirationItem[]>;
}

let inspirationPort: InspirationPort | null = null;

export function configureInspirationPort(port: InspirationPort | null): void {
  inspirationPort = port;
}

export function getInspirationPort(): InspirationPort {
  if (!inspirationPort) {
    throw new Error("Inspiration transport is not composed for this client root.");
  }
  return inspirationPort;
}

export function isInspirationPortConfigured(): boolean {
  return inspirationPort !== null;
}

export function resetInspirationPort(): void {
  inspirationPort = null;
}
