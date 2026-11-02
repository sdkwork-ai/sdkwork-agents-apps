/**
 * Membership types (`app.agents.membership.catalog`).
 *
 * The catalog and current membership are owned by the membership service. No
 * plan, price, or benefit is synthesized when the transport is absent.
 */

export interface MembershipSummary {
  readonly active: boolean;
  readonly levelName?: string;
  readonly expiresAt?: string;
}

export interface MembershipPlan {
  readonly id: string;
  readonly name: string;
  readonly priceLabel?: string;
  readonly periodLabel?: string;
  readonly benefits: readonly string[];
}

export interface MembershipPointsRecord {
  readonly id: string;
  readonly changeType: string;
  readonly changeAmount: string;
  readonly createdAt?: string;
  readonly remark?: string;
}

export interface MembershipCatalog {
  readonly summary: MembershipSummary;
  readonly plans: readonly MembershipPlan[];
  /** Available points balance, when the membership service exposes it. */
  readonly pointsBalance?: number;
  /** Recent points ledger entries, newest first. */
  readonly pointsHistory?: readonly MembershipPointsRecord[];
}
