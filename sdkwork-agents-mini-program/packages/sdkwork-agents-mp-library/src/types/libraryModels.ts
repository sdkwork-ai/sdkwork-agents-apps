/**
 * Library (Resources) domain models for the Agents mini program.
 *
 * A library entry is a Drive node carrying the chat file-library property — the
 * same projection the PC and H5 roots render.
 */

export interface AgentsMpLibraryFile {
  readonly id: string;
  readonly name: string;
  readonly mimeType?: string;
  readonly sizeBytes?: string;
  /** ISO timestamp. */
  readonly updatedAt?: string;
  readonly spaceId?: string;
}

export interface AgentsMpLibraryPage {
  readonly items: AgentsMpLibraryFile[];
  /** Opaque cursor for the next page, or `null` when the listing is complete. */
  readonly nextCursor?: string | null;
}
