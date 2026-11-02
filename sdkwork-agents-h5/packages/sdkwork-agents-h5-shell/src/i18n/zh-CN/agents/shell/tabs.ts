/**
 * Bottom-tab labels for the Agents mobile shell surface.
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. The tab keys are the contract's
 * `titleKey` values (`specs/client-page-parity.spec.json`), so every client
 * root labels the same surfaces.
 */
export const agentsShellTabsZhCn = {
  "agents.mobile.tab.chat": "对话",
  "agents.mobile.tab.inspiration": "灵感",
  "agents.mobile.tab.creative": "生成",
  "agents.mobile.tab.assets": "资产",
  "agents.mobile.tab.agents": "Agent",
  "agents.mobile.tab.createAgent": "创建 Agent",
  "agents.mobile.tab.membership": "会员",
  "agents.mobile.tab.profile": "我的",
  "agents.mobile.tab.settings": "设置",
  "agents.mobile.assets.detailTitle": "资产详情",
  "agents.mobile.tab.canvas": "画布",
  "agents.mobile.tab.tasks": "任务",
  "agents.mobile.tab.experts": "专家",
  "agents.mobile.tab.library": "资料库",
  "agents.mobile.tab.automation": "自动化",
  "agents.mobile.tab.projects": "项目",
  "agents.mobile.tab.market": "市场",
  "agents.mobile.tab.myAgents": "我的智能体",
  "agents.mobile.nav.back": "返回",
  "agents.mobile.nav.retry": "重试",
  "agents.mobile.nav.close": "关闭",
  "agents.mobile.nav.profileEntry": "打开个人中心",
} as const;

export type AgentsShellTabMessageKey = keyof typeof agentsShellTabsZhCn;
