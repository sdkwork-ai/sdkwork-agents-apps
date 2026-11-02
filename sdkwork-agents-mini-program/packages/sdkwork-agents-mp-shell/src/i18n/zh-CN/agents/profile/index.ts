/**
 * Profile surface copy (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. The identity copy carries the
 * privacy statement required for the WeChat avatar/nickname picker.
 */
export const agentsMpProfileZhCn = {
  "agents.profile.title": "我的",
  "agents.profile.account.title": "账号",
  "agents.profile.account.signedIn": "已登录",
  "agents.profile.account.signedOut": "未登录",
  "agents.profile.account.environment": "运行环境",
  "agents.profile.identity.title": "头像昵称",
  "agents.profile.identity.empty": "还没有设置昵称",
  "agents.profile.identity.edit": "设置微信头像昵称",
  "agents.profile.identity.privacy": "头像昵称通过微信选择器获取，仅保存在本机，不会上传到服务器。",
  "agents.profile.identity.saved": "头像昵称已保存",
  "agents.profile.identity.avatarLabel": "我的头像",
  "agents.profile.membership.title": "会员",
  "agents.profile.membership.unavailable": "会员信息在当前运行环境中不可用",
  "agents.profile.usage.title": "本月用量",
  "agents.profile.usage.turns": "{{count}} 轮对话",
  "agents.profile.usage.tokens": "{{count}} tokens",
  "agents.profile.usage.loading": "用量加载中",
  "agents.profile.usage.unavailable": "用量服务暂不可用",
  "agents.profile.links.title": "更多功能",
} as const;

export type AgentsMpProfileMessageKey = keyof typeof agentsMpProfileZhCn;
