/**
 * Membership surface copy (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMembershipCatalogEnUs = {
  "agents.membership.title": "Membership",
  "agents.membership.loading": "Loading membership plans…",
  "agents.membership.loadFailed": "Could not load membership plans. Try again.",
  "agents.membership.unavailable": "Membership is not connected on this client yet. Join or upgrade on desktop.",
  "agents.membership.retry": "Retry",
  "agents.membership.points.title": "Available points",
  "agents.membership.points.balance": "{{count}} points",
  "agents.membership.points.history": "Points activity",
  "agents.membership.current.title": "Current membership",
  "agents.membership.current.none": "No active membership",
  "agents.membership.current.expiresAt": "Valid until {{date}}",
  "agents.membership.plans.title": "Available plans",
  "agents.membership.plans.empty": "No membership plan is available right now.",
  "agents.membership.benefits.title": "Included benefits",
  "agents.membership.checkout.action": "Join / Renew",
  "agents.membership.checkout.unavailable": "Payment is not available on this client yet. Complete it on desktop.",
  "agents.membership.back": "Back",
} as const;
