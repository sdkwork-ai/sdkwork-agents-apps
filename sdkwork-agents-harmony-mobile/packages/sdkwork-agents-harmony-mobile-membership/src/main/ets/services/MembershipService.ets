import {
  unavailableAgentsPageSnapshot,
  type AgentsPageSnapshot,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';

import {
  type MembershipCheckoutResult,
  type MembershipPlan,
  type MembershipSummary,
} from '../models/MembershipModels';

/**
 * Membership use cases.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 4 and
 * `docs/engineering/plans/PLAN-2026-1102-client-page-parity.md` section 6.
 *
 * PC composes the membership/order service packages
 * (`@sdkwork/membership-service`, `@sdkwork/order-service`) directly. This
 * Harmony root composes only the agents app SDK, so plan, summary, and checkout
 * calls report `unavailable` with retry until an adapted transport exists. No
 * price, tier, or benefit value is ever synthesized locally.
 */
export class MembershipService {
  async loadPlans(): Promise<AgentsPageSnapshot<MembershipPlan>> {
    return unavailableAgentsPageSnapshot<MembershipPlan>('agents.membership.unavailable');
  }

  async loadSummary(): Promise<AgentsPageSnapshot<MembershipSummary>> {
    return unavailableAgentsPageSnapshot<MembershipSummary>('agents.membership.unavailable');
  }

  async startCheckout(planId: string): Promise<MembershipCheckoutResult> {
    if (planId.trim().length === 0) {
      return { state: 'invalid', messageKey: 'agents.membership.validation.planRequired' };
    }
    return { state: 'unavailable', messageKey: 'agents.membership.unavailable' };
  }
}
