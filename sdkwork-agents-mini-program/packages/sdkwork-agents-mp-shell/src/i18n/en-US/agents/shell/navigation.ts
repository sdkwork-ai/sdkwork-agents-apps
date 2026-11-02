/**
 * Navigation chrome copy for the Agents mini program shell (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMpShellNavigationEnUs = {
  "agents.mobile.nav.profileEntry": "Me",
  "agents.mobile.nav.back": "Back",
  "agents.mobile.nav.retry": "Retry",
  "agents.mobile.nav.close": "Close",
  "agents.mobile.nav.refresh": "Refresh",
  "agents.mobile.link.membership": "Membership",
  "agents.mobile.link.projects": "Projects",
  "agents.mobile.link.library": "Library",
  "agents.mobile.link.automation": "Automation",
  "agents.mobile.link.history": "Conversation history",
  "agents.mobile.link.settings": "Settings",
} as const;

export type AgentsMpShellNavigationMessageKey = keyof typeof agentsMpShellNavigationEnUs;
