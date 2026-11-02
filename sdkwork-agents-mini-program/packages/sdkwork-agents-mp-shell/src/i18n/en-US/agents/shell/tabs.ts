/**
 * Tab and surface-title labels for the Agents mini program shell (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. The tab keys are the contract's
 * `titleKey` values (`specs/client-page-parity.spec.json`), so every client
 * root labels the same surfaces.
 */
export const agentsMpShellTabsEnUs = {
  "agents.mobile.tab.tasks": "Chat",
  "agents.mobile.tab.inspiration": "Inspiration",
  "agents.mobile.tab.creative": "Create",
  "agents.mobile.tab.assets": "Assets",
  "agents.mobile.tab.experts": "Agent",
  "agents.mobile.tab.library": "Library",
  "agents.mobile.tab.automation": "Automation",
  "agents.mobile.tab.projects": "Projects",
  "agents.mobile.tab.membership": "Membership",
  "agents.mobile.tab.profile": "Me",
  "agents.mobile.tab.settings": "Settings",
  "agents.mobile.tab.canvas": "Canvas",
  "agents.mobile.assets.detailTitle": "Asset details",
  "agents.creative.canvas.open": "Open canvas",
  "agents.mobile.tab.market": "Market",
  "agents.mobile.tab.myAgents": "My agents",
} as const;

export type AgentsMpShellTabMessageKey = keyof typeof agentsMpShellTabsEnUs;
