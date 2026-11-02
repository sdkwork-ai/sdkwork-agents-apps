/**
 * Inspiration feed types (`app.agents.inspiration.discover`).
 *
 * The feed is curated content owned by the feeds service; this package only
 * models the presentation fields it renders, so a stream payload change never
 * leaks a provider-specific envelope into the screen.
 */

export type InspirationChannel = "discover" | "featured";

export interface InspirationItem {
  readonly id: string;
  readonly title: string;
  readonly prompt?: string;
  readonly coverUrl?: string;
  readonly author?: string;
  readonly likes?: number;
  readonly mediaKind?: "image" | "video" | "other";
}
