/**
 * Conversation surface copy (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMpConversationChatEnUs = {
  "agents.conversation.title": "Tasks",
  "agents.conversation.empty.greeting": "SDKWork Agents, at your service",
  "agents.conversation.empty.hint": "Describe your goal and I will break it down and execute.",

  "agents.conversation.composer.placeholder": "Send a message",
  "agents.conversation.composer.send": "Send",
  "agents.conversation.composer.stop": "Stop generating",
  "agents.conversation.composer.voiceUnavailable": "Voice input is not wired in this runtime",

  "agents.conversation.actions.newSession": "New chat",
  "agents.conversation.actions.history": "Chat history",

  "agents.conversation.sessions.title": "Chats",
  "agents.conversation.sessions.empty": "No chats yet",
  "agents.conversation.sessions.untitled": "Untitled chat",

  "agents.conversation.reasoning.title": "Thinking",
  "agents.conversation.tool.running": "Running",
  "agents.conversation.tool.completed": "Done",
  "agents.conversation.tool.failed": "Failed",

  "agents.conversation.status.sending": "Replying",
  "agents.conversation.status.loading": "Loading",

  "agents.conversation.error.send": "Message failed to send, please retry",
  "agents.conversation.error.loadSessions": "Failed to load chats",
  "agents.conversation.error.loadMessages": "Failed to load messages",
} as const;
