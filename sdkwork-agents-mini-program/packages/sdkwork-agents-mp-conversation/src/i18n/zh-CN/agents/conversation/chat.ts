/**
 * Conversation surface copy (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMpConversationChatZhCn = {
  "agents.conversation.title": "任务",
  "agents.conversation.empty.greeting": "SDKWork Agents，我帮你",
  "agents.conversation.empty.hint": "直接描述你的目标，我会拆解并执行。",

  "agents.conversation.composer.placeholder": "发消息",
  "agents.conversation.composer.send": "发送",
  "agents.conversation.composer.stop": "停止生成",
  "agents.conversation.composer.voiceUnavailable": "当前运行环境未接入语音输入",

  "agents.conversation.actions.newSession": "新建对话",
  "agents.conversation.actions.history": "会话历史",

  "agents.conversation.sessions.title": "会话",
  "agents.conversation.sessions.empty": "暂无历史会话",
  "agents.conversation.sessions.untitled": "未命名对话",

  "agents.conversation.reasoning.title": "思考过程",
  "agents.conversation.tool.running": "调用中",
  "agents.conversation.tool.completed": "已完成",
  "agents.conversation.tool.failed": "调用失败",

  "agents.conversation.status.sending": "正在回复",
  "agents.conversation.status.loading": "加载中",

  "agents.conversation.error.send": "消息发送失败，请重试",
  "agents.conversation.error.loadSessions": "会话列表加载失败",
  "agents.conversation.error.loadMessages": "消息加载失败",
} as const;

export type AgentsMpConversationChatMessageKey = keyof typeof agentsMpConversationChatZhCn;
