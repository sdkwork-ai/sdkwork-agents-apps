/**
 * Projects surface copy (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. Keys mirror the PC and H5 roots so
 * every client speaks one vocabulary.
 */
export const agentsMpProjectsListZhCn = {
  "agents.projects.title": "项目",
  "agents.projects.search.placeholder": "搜索项目",
  "agents.projects.empty": "还没有项目",
  "agents.projects.loading": "加载中",
  "agents.projects.loadFailed": "项目加载失败，请稍后重试",
  "agents.projects.truncated": "项目较多，仅展示最近的部分",
  "agents.projects.sessionCount": "{{count}} 个会话",
} as const;

export type AgentsMpProjectsListMessageKey = keyof typeof agentsMpProjectsListZhCn;
