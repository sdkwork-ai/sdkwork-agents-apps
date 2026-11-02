/**
 * Profile surface copy (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. The identity copy carries the
 * privacy statement required for the WeChat avatar/nickname picker.
 */
export const agentsMpProfileEnUs = {
  "agents.profile.title": "Me",
  "agents.profile.account.title": "Account",
  "agents.profile.account.signedIn": "Signed in",
  "agents.profile.account.signedOut": "Signed out",
  "agents.profile.account.environment": "Runtime",
  "agents.profile.identity.title": "Avatar and nickname",
  "agents.profile.identity.empty": "No nickname yet",
  "agents.profile.identity.edit": "Choose WeChat avatar and nickname",
  "agents.profile.identity.privacy": "The avatar and nickname come from the WeChat picker and are stored on this device only. Nothing is uploaded.",
  "agents.profile.identity.saved": "Avatar and nickname saved",
  "agents.profile.identity.avatarLabel": "My avatar",
  "agents.profile.membership.title": "Membership",
  "agents.profile.membership.unavailable": "Membership is unavailable in this runtime",
  "agents.profile.usage.title": "Usage",
  "agents.profile.usage.turns": "{{count}} turns",
  "agents.profile.usage.tokens": "{{count}} tokens",
  "agents.profile.usage.loading": "Loading usage",
  "agents.profile.usage.unavailable": "Usage is unavailable",
  "agents.profile.links.title": "More",
} as const;

export type AgentsMpProfileMessageKey = keyof typeof agentsMpProfileEnUs;
