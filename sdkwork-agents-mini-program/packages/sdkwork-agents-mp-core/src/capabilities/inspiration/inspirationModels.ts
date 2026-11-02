/**
 * Inspiration domain models for the Agents mini program.
 *
 * An inspiration item is one entry of the discover/featured feed the PC
 * inspiration surface renders. The record shape is deliberately capability-local
 * so a future feed transport can map onto it without leaking DTOs into pages.
 */

/** Feed segment. The mini program exposes the two primary PC segments. */
export type AgentsMpInspirationSegment = "discover" | "featured";

export type AgentsMpInspirationMediaKind = "image" | "video";

export interface AgentsMpInspirationItem {
  readonly id: string;
  readonly title: string;
  /** Prompt that produced the work, when the feed publishes one. */
  readonly prompt?: string;
  /** Cover/preview URL; already resolved by the feed source. */
  readonly coverUrl?: string;
  readonly mediaKind: AgentsMpInspirationMediaKind;
  readonly author?: string;
  readonly authorAvatarUrl?: string;
  readonly likes?: number;
  /** ISO timestamp. */
  readonly publishedAt?: string;
}

/**
 * Transport availability. The mini program runtime composes the Agents and
 * Drive app SDKs only; the feeds/skills SDKs the PC inspiration surface reads are
 * not part of that composition, so this surface reports the gap explicitly
 * instead of rendering a fabricated feed (`PLAN-2026-1102-client-page-parity.md`
 * section 6, "Data honesty").
 */
export type AgentsMpInspirationAvailability = "available" | "unavailable";

export type AgentsMpInspirationUnavailableReason = "transport-not-composed";

export interface AgentsMpInspirationFeed {
  readonly segment: AgentsMpInspirationSegment;
  readonly availability: AgentsMpInspirationAvailability;
  readonly items: AgentsMpInspirationItem[];
  readonly nextCursor?: string | null;
  /** Present only when `availability` is `unavailable`. */
  readonly reason?: AgentsMpInspirationUnavailableReason;
}
