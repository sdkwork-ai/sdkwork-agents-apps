/**
 * Membership surface copy (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. Unavailable copy states the
 * current runtime fact and gives the actionable alternative; it never promises a
 * later release.
 */
export const agentsMpMembershipEnUs = {
  "agents.membership.title": "Membership",
  "agents.membership.cashier.title": "Checkout",
  "agents.membership.cashier.invalid": "The checkout URL is unavailable.",
  "agents.membership.current.title": "Current membership",
  "agents.membership.current.none": "No active membership",
  "agents.membership.current.expiresAt": "Valid until {{date}}",
  "agents.membership.plans.title": "Plans",
  "agents.membership.plans.empty": "No plan is available right now",
  "agents.membership.loading": "Loading membership",
  "agents.membership.loadFailed": "Membership failed to load. Try again",
  "agents.membership.unavailable": "The membership service is unavailable in this runtime",
  "agents.membership.checkout.unavailable": "Payment is unavailable right now. Try again later.",
  "agents.membership.checkout.action": "Subscribe",
  "agents.membership.benefits.title": "Benefits",
  "agents.membership.points.title": "Available points",
  "agents.membership.points.balance": "{{count}} points",
} as const;

export type AgentsMpMembershipMessageKey = keyof typeof agentsMpMembershipEnUs;
