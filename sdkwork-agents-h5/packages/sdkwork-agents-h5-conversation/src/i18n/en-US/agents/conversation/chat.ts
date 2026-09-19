/**
 * Conversation surface copy (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsConversationChatEnUs = {
  "agents.conversation.header.title": "SDKWork Agents",
  "agents.conversation.header.menu": "Sessions and actions",
  "agents.conversation.header.switchSession": "Switch session",
  "agents.conversation.header.newSession": "New chat",

  "agents.conversation.empty.greeting": "SDKWork Agents, at your service",
  "agents.conversation.empty.hint": "Describe your goal and I will plan and execute it.",

  "agents.conversation.composer.placeholder": "Send a message or hold to talk",
  "agents.conversation.composer.send": "Send",
  "agents.conversation.composer.stop": "Stop generating",
  "agents.conversation.composer.hold": "Hold to talk",
  "agents.conversation.composer.release": "Release to send",
  "agents.conversation.composer.voice": "Voice input",
  "agents.conversation.composer.voiceUnavailable": "Voice input is not wired in this runtime",
  "agents.conversation.composer.more": "More actions",

  "agents.conversation.actions.newSession": "New chat",
  "agents.conversation.actions.history": "Chat history",

  "agents.conversation.sessions.title": "Sessions",
  "agents.conversation.sessions.empty": "No sessions yet",
  "agents.conversation.sessions.untitled": "Untitled chat",
  "agents.conversation.sessions.rename": "Rename",
  "agents.conversation.sessions.delete": "Delete",
  "agents.conversation.sessions.cancel": "Cancel",
  "agents.conversation.sessions.confirm": "Confirm",

  "agents.conversation.message.copy": "Copy",
  "agents.conversation.message.copied": "Copied",
  "agents.conversation.message.copyFailed": "Copy failed",
  "agents.conversation.message.you": "You",
  "agents.conversation.message.assistant": "SDKWork Agents",

  "agents.conversation.reasoning.title": "Reasoning",
  "agents.conversation.tool.running": "Running",
  "agents.conversation.tool.completed": "Completed",
  "agents.conversation.tool.failed": "Failed",

  "agents.conversation.status.sending": "Responding",
  "agents.conversation.status.loading": "Loading",

  "agents.conversation.error.send": "Message failed to send. Please retry.",
  "agents.conversation.error.loadSessions": "Failed to load sessions",
  "agents.conversation.error.loadMessages": "Failed to load messages",
  "agents.conversation.error.sessionRequired": "Create a session first",
} as const;
