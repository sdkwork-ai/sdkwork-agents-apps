/**
 * Inspiration surface copy (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. Keys mirror the PC inspiration
 * surface so every client speaks one vocabulary. Unavailable copy states the
 * current runtime fact instead of promising a later release.
 */
export const agentsMpInspirationZhCn = {
  "agents.inspiration.title": "灵感",
  "agents.inspiration.segment.discover": "发现",
  "agents.inspiration.segment.featured": "精选",
  "agents.inspiration.loading": "正在加载灵感内容",
  "agents.inspiration.empty": "这里还没有灵感内容",
  "agents.inspiration.loadFailed": "灵感内容加载失败，请重试",
  "agents.inspiration.unavailable": "灵感内容服务在当前运行环境中不可用",
  "agents.inspiration.count": "共 {{count}} 条",
  "agents.inspiration.likes": "{{count}} 赞",
  "agents.inspiration.promptLabel": "提示词",
  "agents.inspiration.pullHint": "下拉刷新",
} as const;

export type AgentsMpInspirationMessageKey = keyof typeof agentsMpInspirationZhCn;
