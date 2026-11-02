/**
 * Tab and surface-title labels for the Agents mini program shell (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. The tab keys are the contract's
 * `titleKey` values (`specs/client-page-parity.spec.json`), so every client
 * root labels the same surfaces.
 */
export const agentsMpShellTabsZhCn = {
  "agents.mobile.tab.tasks": "对话",
  "agents.mobile.tab.inspiration": "灵感",
  "agents.mobile.tab.creative": "生成",
  "agents.mobile.tab.assets": "资产",
  "agents.mobile.tab.experts": "Agent",
  "agents.mobile.tab.library": "资料库",
  "agents.mobile.tab.automation": "自动化",
  "agents.mobile.tab.projects": "项目",
  "agents.mobile.tab.membership": "会员",
  "agents.mobile.tab.profile": "我的",
  "agents.mobile.tab.settings": "设置",
  "agents.mobile.tab.canvas": "画布",
  "agents.mobile.assets.detailTitle": "资产详情",
  "agents.creative.canvas.open": "打开画布",
  "agents.mobile.tab.market": "市场",
  "agents.mobile.tab.myAgents": "我的智能体",
} as const;

export type AgentsMpShellTabMessageKey = keyof typeof agentsMpShellTabsZhCn;
