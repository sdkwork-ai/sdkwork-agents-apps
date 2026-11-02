/**
 * Membership domain models for the Agents mini program.
 *
 * A membership plan and the caller's current membership are owned by the
 * membership service; this root composes neither the membership nor the order app
 * SDK, so the surface reports the gap instead of inventing plans or prices
 * (`PLAN-2026-1102-client-page-parity.md` section 6, "Data honesty").
 */

export type AgentsMpMembershipAvailability = "available" | "unavailable";

export type AgentsMpMembershipUnavailableReason =
  | "transport-not-composed"
  | "checkout-not-composed";

export interface AgentsMpMembershipPlan {
  readonly id: string;
  readonly name: string;
  /** Pre-formatted price label published by the membership service. */
  readonly priceLabel?: string;
  /** Pre-formatted billing period label (month, year, ...). */
  readonly periodLabel?: string;
  readonly benefits: string[];
}

export interface AgentsMpMembershipSummary {
  readonly active: boolean;
  readonly levelName?: string;
  /** ISO timestamp of the end of the current term. */
  readonly expiresAt?: string;
}

export interface AgentsMpMembershipCatalog {
  readonly availability: AgentsMpMembershipAvailability;
  readonly summary: AgentsMpMembershipSummary;
  readonly plans: AgentsMpMembershipPlan[];
  /** Available points balance, when the membership service exposes it. */
  readonly pointsBalance?: number;
  readonly reason?: AgentsMpMembershipUnavailableReason;
}
