/**
 * Automation surface copy (zh-CN). Fragment path follows `I18N_SPEC.md` 6.1.
 */
export const agentsAutomationIndexZhCn = {
  "agents.automation.title": "自动化",
  "agents.automation.search.placeholder": "搜索自动化任务",
  "agents.automation.empty": "还没有自动化任务",
  "agents.automation.loading": "加载中",
  "agents.automation.loadFailed": "自动化任务加载失败，请稍后重试",
  "agents.automation.truncated": "任务较多，仅展示最近的部分",
  "agents.automation.status.active": "运行中",
  "agents.automation.status.paused": "已暂停",
  "agents.automation.status.completed": "已完成",
  "agents.automation.status.cancelled": "已取消",
} as const;

export type AgentsAutomationIndexMessageKey = keyof typeof agentsAutomationIndexZhCn;
