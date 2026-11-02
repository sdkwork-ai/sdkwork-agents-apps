/**
 * Navigation chrome copy for the Agents mini program shell (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMpShellNavigationZhCn = {
  "agents.mobile.nav.profileEntry": "我的",
  "agents.mobile.nav.back": "返回",
  "agents.mobile.nav.retry": "重试",
  "agents.mobile.nav.close": "关闭",
  "agents.mobile.nav.refresh": "刷新",
  "agents.mobile.link.membership": "会员",
  "agents.mobile.link.projects": "项目",
  "agents.mobile.link.library": "资料库",
  "agents.mobile.link.automation": "自动化",
  "agents.mobile.link.history": "会话历史",
  "agents.mobile.link.settings": "设置",
} as const;

export type AgentsMpShellNavigationMessageKey = keyof typeof agentsMpShellNavigationZhCn;
