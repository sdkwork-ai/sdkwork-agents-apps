/**
 * Membership surface copy (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. Unavailable copy states the
 * current runtime fact and gives the actionable alternative; it never promises a
 * later release.
 */
export const agentsMpMembershipZhCn = {
  "agents.membership.title": "会员",
  "agents.membership.cashier.title": "收银台",
  "agents.membership.cashier.invalid": "收银台地址不可用",
  "agents.membership.current.title": "当前会员",
  "agents.membership.current.none": "尚未开通会员",
  "agents.membership.current.expiresAt": "有效期至 {{date}}",
  "agents.membership.plans.title": "会员方案",
  "agents.membership.plans.empty": "当前没有可开通的会员方案",
  "agents.membership.loading": "正在加载会员信息",
  "agents.membership.loadFailed": "会员信息加载失败，请重试",
  "agents.membership.unavailable": "会员服务在当前运行环境中不可用",
  "agents.membership.checkout.unavailable": "当前支付通道不可用，请稍后重试",
  "agents.membership.checkout.action": "开通",
  "agents.membership.benefits.title": "会员权益",
  "agents.membership.points.title": "可用积分",
  "agents.membership.points.balance": "{{count}} 积分",
} as const;

export type AgentsMpMembershipMessageKey = keyof typeof agentsMpMembershipZhCn;
