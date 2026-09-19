import {
  type AgentsMpConversationMessage,
  type AgentsMpConversationSession,
  type AgentsMpConversationToolCall,
  type AgentsMpConversationToolStreamEvent,
} from "../types/conversationModels";

/**
 * Package-local state slice for the conversation surface.
 *
 * Mini program pages own `this.data`; this module supplies the initial value,
 * the logout reset, and the pure reducers the page applies on every stream
 * event. Nothing here touches transport, so the reducers are unit-testable.
 *
 * Sensitive state must clear on logout and account/tenant switch.
 */
export interface AgentsMpConversationStateSlice {
  readonly sessions: readonly AgentsMpConversationSession[];
  readonly activeSessionId: string;
  readonly messages: readonly AgentsMpConversationMessage[];
  readonly loadingSessions: boolean;
  readonly loadingMessages: boolean;
  readonly sending: boolean;
  readonly errorMessage: string;
  readonly hasMoreHistory: boolean;
  readonly nextCursor: string;
}

export const initialAgentsMpConversationState: AgentsMpConversationStateSlice = {
  sessions: [],
  activeSessionId: "",
  messages: [],
  loadingSessions: true,
  loadingMessages: false,
  sending: false,
  errorMessage: "",
  hasMoreHistory: false,
  nextCursor: "",
};

export function clearAgentsMpConversationState(): AgentsMpConversationStateSlice {
  return { ...initialAgentsMpConversationState };
}

let localMessageSequence = 0;

export function nextAgentsMpLocalMessageId(prefix: string): string {
  localMessageSequence += 1;
  return `${prefix}.${Date.now().toString(36)}.${localMessageSequence.toString(36)}`;
}

/** Applies one streamed delta to the message with `messageId`. */
export function appendAgentsMpMessageText(
  messages: readonly AgentsMpConversationMessage[],
  messageId: string,
  delta: string,
): AgentsMpConversationMessage[] {
  return messages.map((message) =>
    message.id === messageId ? { ...message, text: `${message.text}${delta}` } : message,
  );
}

/** Applies one reasoning delta to the message with `messageId`. */
export function appendAgentsMpMessageReasoning(
  messages: readonly AgentsMpConversationMessage[],
  messageId: string,
  delta: string,
): AgentsMpConversationMessage[] {
  return messages.map((message) =>
    message.id === messageId
      ? { ...message, reasoning: `${message.reasoning ?? ""}${delta}` }
      : message,
  );
}

/**
 * Merges one tool lifecycle event into a message's tool-call list, creating the
 * entry on the first `start` frame and closing it on `stop` (or `tool.result`).
 */
export function applyAgentsMpToolEvent(
  toolCalls: readonly AgentsMpConversationToolCall[],
  event: AgentsMpConversationToolStreamEvent,
): AgentsMpConversationToolCall[] {
  const id = event.toolCallId ?? `tool.${toolCalls.length}`;
  const existingIndex = toolCalls.findIndex((call) => call.id === id);
  const existing = existingIndex >= 0 ? toolCalls[existingIndex] : undefined;
  const merged: AgentsMpConversationToolCall = {
    id,
    name: event.toolName ?? existing?.name,
    status: event.phase === "stop" ? (event.isError ? "error" : "completed") : "running",
    arguments: `${existing?.arguments ?? ""}${event.delta ?? ""}` || undefined,
    error: event.phase === "stop" && event.isError ? event.result : existing?.error,
  };
  if (existingIndex >= 0) {
    const next = [...toolCalls];
    next[existingIndex] = merged;
    return next;
  }
  return [...toolCalls, merged];
}

/** Applies one tool lifecycle event to the message with `messageId`. */
export function applyAgentsMpToolEventToMessage(
  messages: readonly AgentsMpConversationMessage[],
  messageId: string,
  event: AgentsMpConversationToolStreamEvent,
): AgentsMpConversationMessage[] {
  return messages.map((message) =>
    message.id === messageId
      ? { ...message, toolCalls: applyAgentsMpToolEvent(message.toolCalls ?? [], event) }
      : message,
  );
}

/** Marks a streaming message terminal and optionally attaches a failure text. */
export function finishAgentsMpMessage(
  messages: readonly AgentsMpConversationMessage[],
  messageId: string,
  errorMessage?: string,
): AgentsMpConversationMessage[] {
  return messages.map((message) =>
    message.id === messageId
      ? {
          ...message,
          streaming: false,
          ...(errorMessage ? { error: errorMessage } : {}),
        }
      : message,
  );
}
