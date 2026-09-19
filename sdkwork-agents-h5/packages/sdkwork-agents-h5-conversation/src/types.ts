/**
 * Conversation domain types for the Agents mobile surfaces.
 *
 * Semantics follow `AGENTS_DOMAIN_SPEC.md`: a rendered conversation is an
 * `AgentSession`, one exchange is an `AgentTurn`, and each transcript row is an
 * `AgentSessionItem`. UI copy may say "message"; the durable resources keep the
 * Agents vocabulary.
 */

export type ConversationMessageRole = "user" | "assistant" | "system" | "tool";

/** Structured tool/skill/MCP invocation attached to an assistant message. */
export interface ConversationToolCall {
  id: string;
  name?: string;
  status: "running" | "completed" | "error";
  /** Accumulated JSON arguments for the invocation. */
  arguments?: string;
  durationMs?: number;
  error?: string;
}

export interface ConversationMessage {
  id: string;
  role: ConversationMessageRole;
  text: string;
  /** Thinking/reasoning text rendered as a collapsible block. */
  reasoning?: string;
  /** Tool/skill/MCP invocations performed within this turn. */
  toolCalls?: ConversationToolCall[];
  createdAt?: string;
  /** True while the assistant message is still receiving stream deltas. */
  streaming?: boolean;
  /** Localized failure text when the turn did not complete. */
  error?: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  /** Epoch milliseconds. */
  updatedAt: number;
  version: string;
}

export interface ConversationMessagePage {
  items: ConversationMessage[];
  hasMore: boolean;
  nextCursor?: string;
}

/** Wire form of a streamed tool-call lifecycle event. */
export interface ConversationToolStreamEvent {
  phase: "start" | "delta" | "stop";
  toolCallId?: string;
  toolName?: string;
  delta?: string;
  /** Raw tool-result payload (JSON) carried by the terminal event. */
  result?: string;
  /** True when the tool reported a failure. */
  isError?: boolean;
}

/** Agent scope of one conversation. */
export interface ConversationScope {
  agentId: string;
  title?: string;
  systemPrompt?: string;
  welcomeMessage?: string;
}

export interface ConversationTurnRequest {
  agentId: string;
  sessionId: string;
  content: string;
  model?: string;
  systemPrompt?: string;
  wireProtocol?: string;
}

export interface ConversationTurnResult {
  id: string;
  content: string;
}

export interface ConversationTurnHandlers {
  onDelta?: (delta: string) => void;
  onReasoning?: (reasoning: string) => void;
  onToolEvent?: (event: ConversationToolStreamEvent) => void;
}

export interface ConversationSendFailure {
  /** Fallback display message (the SDK error message, already safe). */
  message: string;
  /** Backend problem i18n key (e.g. `errors.result.50301`) when available. */
  i18nKey?: string;
  /** Backend problem numeric code (e.g. `50301`) for `errors.result.<code>`. */
  code?: number | string;
  httpStatus?: number;
  traceId?: string;
}
