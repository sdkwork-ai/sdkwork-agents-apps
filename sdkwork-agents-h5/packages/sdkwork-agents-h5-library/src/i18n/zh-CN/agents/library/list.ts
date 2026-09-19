/**
 * Library surface copy (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1.
 */
export const agentsLibraryListZhCn = {
  "agents.library.title": "资料库",
  "agents.library.search.placeholder": "搜索资料库",
  "agents.library.empty": "资料库中还没有内容",
  "agents.library.loading": "加载中",
  "agents.library.loadFailed": "资料库加载失败，请稍后重试",
  "agents.library.truncated": "内容较多，仅展示最近的部分",
  "agents.library.openFailed": "无法打开该文件",
} as const;

export type AgentsLibraryListMessageKey = keyof typeof agentsLibraryListZhCn;
