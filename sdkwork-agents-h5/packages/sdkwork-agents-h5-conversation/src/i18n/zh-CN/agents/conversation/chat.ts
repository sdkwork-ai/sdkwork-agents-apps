/**
 * Conversation surface copy (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsConversationChatZhCn = {
  "agents.conversation.header.title": "SDKWork Agents",
  "agents.conversation.header.menu": "会话与操作",
  "agents.conversation.header.switchSession": "切换会话",
  "agents.conversation.header.newSession": "新建对话",

  "agents.conversation.empty.greeting": "SDKWork Agents，我帮你",
  "agents.conversation.empty.hint": "直接描述你的目标，我会拆解并执行。",

  "agents.conversation.composer.placeholder": "发消息或按住说话",
  "agents.conversation.composer.send": "发送",
  "agents.conversation.composer.stop": "停止生成",
  "agents.conversation.composer.hold": "按住说话",
  "agents.conversation.composer.release": "松开发送",
  "agents.conversation.composer.voice": "语音输入",
  "agents.conversation.composer.voiceUnavailable": "当前运行环境未接入语音输入",
  "agents.conversation.composer.more": "更多操作",

  "agents.conversation.actions.newSession": "新建对话",
  "agents.conversation.actions.history": "会话历史",

  "agents.conversation.sessions.title": "会话",
  "agents.conversation.sessions.empty": "暂无历史会话",
  "agents.conversation.sessions.untitled": "未命名对话",
  "agents.conversation.sessions.rename": "重命名",
  "agents.conversation.sessions.delete": "删除",
  "agents.conversation.sessions.cancel": "取消",
  "agents.conversation.sessions.confirm": "确定",

  "agents.conversation.message.copy": "复制",
  "agents.conversation.message.copied": "已复制",
  "agents.conversation.message.copyFailed": "复制失败",
  "agents.conversation.message.you": "我",
  "agents.conversation.message.assistant": "SDKWork Agents",

  "agents.conversation.reasoning.title": "思考过程",
  "agents.conversation.tool.running": "调用中",
  "agents.conversation.tool.completed": "已完成",
  "agents.conversation.tool.failed": "调用失败",

  "agents.conversation.status.sending": "正在回复",
  "agents.conversation.status.loading": "加载中",

  "agents.conversation.error.send": "消息发送失败，请重试",
  "agents.conversation.error.loadSessions": "会话列表加载失败",
  "agents.conversation.error.loadMessages": "消息加载失败",
  "agents.conversation.error.sessionRequired": "请先创建会话",
} as const;

export type AgentsConversationChatMessageKey = keyof typeof agentsConversationChatZhCn;
