/**
 * View models for the membership capability.
 *
 * API DTOs come from the membership/order service SDKs; this file owns view
 * models only.
 */
export interface MembershipPlan {
  readonly id: string;
  readonly name: string;
  readonly priceLabel: string;
  readonly periodLabel: string;
  readonly benefits: string[];
}

export interface MembershipSummary {
  readonly tierName: string;
  readonly status: string;
  readonly pointBalance: string;
}

export type MembershipCheckoutState = 'unavailable' | 'invalid' | 'started';

export interface MembershipCheckoutResult {
  readonly state: MembershipCheckoutState;
  readonly messageKey: string;
}
