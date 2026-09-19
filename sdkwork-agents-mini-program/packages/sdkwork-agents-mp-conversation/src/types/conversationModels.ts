/**
 * Conversation domain models for the Agents mini program surfaces.
 *
 * Semantics follow `AGENTS_DOMAIN_SPEC.md`: a rendered conversation is an
 * `AgentSession`, one exchange is an `AgentTurn`, and each transcript row is an
 * `AgentSessionItem`. UI copy may say "message"; the durable resources keep the
 * Agents vocabulary. The shapes mirror the H5 and Flutter roots so all three
 * render the same transcript.
 */

export type AgentsMpConversationRole = "user" | "assistant" | "system" | "tool";

export interface AgentsMpConversationToolCall {
  id: string;
  name?: string;
  status: "running" | "completed" | "error";
  arguments?: string;
  error?: string;
}

export interface AgentsMpConversationMessage {
  id: string;
  role: AgentsMpConversationRole;
  text: string;
  /** Thinking/reasoning text rendered as a collapsible block. */
  reasoning?: string;
  toolCalls?: AgentsMpConversationToolCall[];
  createdAt?: string;
  /** True while the assistant message is still receiving stream deltas. */
  streaming?: boolean;
  /** Localized failure text when the turn did not complete. */
  error?: string;
}

export interface AgentsMpConversationSession {
  id: string;
  title: string;
  /** Epoch milliseconds. */
  updatedAt: number;
  version: string;
}

export interface AgentsMpConversationMessagePage {
  items: AgentsMpConversationMessage[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface AgentsMpConversationTurnResult {
  id: string;
  content: string;
}

/** Streamed tool/skill/MCP lifecycle event from the kernel-v1 protocol. */
export interface AgentsMpConversationToolStreamEvent {
  phase: "start" | "delta" | "stop";
  toolCallId?: string;
  toolName?: string;
  delta?: string;
  result?: string;
  isError?: boolean;
}

export interface AgentsMpConversationStreamHandlers {
  onDelta?: (delta: string) => void;
  onReasoning?: (reasoning: string) => void;
  onToolEvent?: (event: AgentsMpConversationToolStreamEvent) => void;
}
