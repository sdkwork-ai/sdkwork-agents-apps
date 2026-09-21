export {
  ChatService,
  callerScopeGrantsAgentManage,
  configureChatAgentPermissionScopeReader,
  configureChatAgentPort,
  createChatAgentScope,
  DEFAULT_CHAT_AGENT_ID,
  DEFAULT_CHAT_AGENT_SCOPE,
  isDefaultChatAgentScope,
} from './services/ChatService';
export type {
  ChatAgentConfig,
  ChatAgentPermissionScopeReader,
  ChatAgentPort,
  ChatAgentScope,
  ChatServiceOptions,
} from './services/ChatService';
export { ProjectService, configureProjectPort } from './services/ProjectService';
export {
  extractToolMedia,
  toolMediaKind,
  toolProgressKey,
  TOOL_DONE_DEFAULTS,
  TOOL_PROGRESS_DEFAULTS,
} from './services/toolMedia';
export type { ToolMedia, ToolMediaKind } from './services/toolMedia';
export type {
  ChatMemorySpaceOption,
  ChatProject,
  ChatProjectCompositionSlot,
  ProjectDetails,
  ProjectPort,
  ProjectSettingsData,
} from './services/ProjectService';
export {
  AGENTS_OPEN_TOKEN_PLAN_EVENT,
  AGENTS_TOKEN_PLAN_CLOSED_EVENT,
  configureChatBalancePort,
  getChatBalancePort,
  isChatBalanceInsufficient,
  requestAgentsTokenPlan,
} from './services/chatBalancePort';
export type { ChatBalancePort, ChatBalanceSnapshot } from './services/chatBalancePort';
export { useChatBalanceAlert } from './hooks/useChatBalanceAlert';
export type { ChatBalanceAlertState } from './hooks/useChatBalanceAlert';
export {
  readStoredWireProtocol,
  useWireProtocol,
  WIRE_PROTOCOL_OPTIONS,
} from './hooks/useWireProtocol';
export type { WireProtocolId } from './hooks/useWireProtocol';
export { ChatBalanceAlert } from './components/ChatBalanceAlert';
export type { ChatBalanceAlertProps } from './components/ChatBalanceAlert';
export { ChatFailureCard } from './components/ChatFailureCard';
export type { ChatFailureCardProps } from './components/ChatFailureCard';
export {
  classifyChatFailure,
  isInsufficientBalanceFailure,
  INSUFFICIENT_BALANCE_CODE,
  INSUFFICIENT_BALANCE_HTTP_STATUS,
} from './utils/chatFailure';
export type { ChatFailureKind, ChatFailureLike } from './utils/chatFailure';
export type {
  ChatMessage,
  ChatMessageFailure,
  ChatSession,
  ChatToolCall,
  ChatToolStreamEvent,
  MessageRole,
} from './types';
export type { ChatViewProps } from './ChatView';
export type { ChatPcSession } from './session';
