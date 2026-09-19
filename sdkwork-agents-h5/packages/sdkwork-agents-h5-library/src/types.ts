/**
 * Library (Resources) domain types for the Agents mobile surfaces.
 *
 * A library entry is a Drive node carrying the chat file-library property, the
 * same projection the PC workbench renders.
 */

/** One file-library entry. */
export interface LibraryFile {
  id: string;
  name: string;
  mimeType?: string;
  sizeBytes?: string;
  /** ISO timestamp. */
  updatedAt?: string;
  spaceId?: string;
}

export interface LibraryPage {
  items: LibraryFile[];
  /** Opaque cursor for the next page, or `null` when the listing is complete. */
  nextCursor?: string | null;
}
