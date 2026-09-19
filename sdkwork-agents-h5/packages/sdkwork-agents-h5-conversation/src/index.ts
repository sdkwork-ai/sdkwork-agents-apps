/**
 * Public integration surface of the Agents H5 conversation capability.
 *
 * Screens and internal message widgets stay private; consumers compose the
 * surface through the screen component, the service, and the injected port.
 */

export { ConversationScreen } from "./screens/ConversationScreen";
export type { ConversationScreenProps } from "./screens/ConversationScreen";

export {
  ConversationService,
  DEFAULT_CONVERSATION_AGENT_ID,
  DEFAULT_CONVERSATION_SCOPE,
  callerScopeGrantsAgentManage,
  createConversationScope,
  isDefaultConversationScope,
  resetConversationCaches,
} from "./services/ConversationService";
export type { ConversationStreamOptions } from "./services/ConversationService";

export {
  configureConversationPort,
  getConversationPort,
  isConversationPortConfigured,
  resetConversationPort,
} from "./services/conversationPort";
export type {
  ConversationAgentDraft,
  ConversationAgentRecord,
  ConversationPort,
} from "./services/conversationPort";

export type { ConversationVoicePort } from "./services/conversationVoicePort";
export type { ConversationComposerAction } from "./components/ConversationComposer";

export { conversationRouteContributions } from "./routes/conversationRouteContributions";

export {
  AGENTS_CONVERSATION_MESSAGES,
  DEFAULT_AGENTS_CONVERSATION_LOCALE,
  configureAgentsConversationLocale,
  getAgentsConversationLocale,
  normalizeAgentsConversationLocale,
  resolveAgentsConversationMessages,
  translateAgentsConversationText,
} from "./i18n";
export type {
  AgentsConversationLocale,
  AgentsConversationMessageKey,
  AgentsConversationMessages,
} from "./i18n";

export type {
  ConversationMessage,
  ConversationMessagePage,
  ConversationMessageRole,
  ConversationScope,
  ConversationSendFailure,
  ConversationSession,
  ConversationToolCall,
  ConversationToolStreamEvent,
  ConversationTurnHandlers,
  ConversationTurnRequest,
  ConversationTurnResult,
} from "./types";
