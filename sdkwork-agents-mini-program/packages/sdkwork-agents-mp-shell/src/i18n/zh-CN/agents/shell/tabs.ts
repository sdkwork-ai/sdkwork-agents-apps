/**
 * Bottom-tab labels for the Agents mini program shell surface.
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMpShellTabsZhCn = {
  "agents.mobile.tab.tasks": "任务",
  "agents.mobile.tab.experts": "专家",
  "agents.mobile.tab.library": "资料库",
  "agents.mobile.tab.automation": "自动化",
  "agents.mobile.tab.projects": "项目",
  "agents.mobile.tab.market": "市场",
  "agents.mobile.tab.myAgents": "我的智能体",
} as const;

export type AgentsMpShellTabMessageKey = keyof typeof agentsMpShellTabsZhCn;
