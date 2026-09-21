export type MessageRole = 'user' | 'model';

import type { ToolMedia } from './services/toolMedia';

/** Structured tool/skill/MCP invocation attached to an assistant message. */
export interface ChatToolCall {
  id: string;
  name?: string;
  status: 'running' | 'completed' | 'error';
  /** Accumulated JSON arguments for the invocation. */
  arguments?: string;
  durationMs?: number;
  /** Renderable media extracted from the tool result (image/video/audio). */
  media?: ToolMedia[];
  /** Error text when the tool failed. */
  error?: string;
}

/** Wire form of a streamed tool-call lifecycle event delivered to the chat UI. */
export interface ChatToolStreamEvent {
  phase: 'start' | 'delta' | 'stop';
  toolCallId?: string;
  toolName?: string;
  delta?: string;
  /** Raw tool-result payload (JSON) carried by the terminal event. */
  result?: string;
  /** True when the tool reported a failure. */
  isError?: boolean;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  /** Thinking/reasoning text rendered as a collapsible block. */
  reasoning?: string;
  /** Tool/skill/MCP invocations performed within this turn. */
  toolCalls?: ChatToolCall[];
  images?: string[];
  mediaResources?: import('@sdkwork/agents-pc-core/sdk/driveUploadService').AgentsDriveMediaResource[];
  feedback?: 'up' | 'down';
  feedbackVersion?: string;
  /**
   * Structured failure attached when the turn ended in an error the user must
   * act on. Kept separate from `text` (where a plain message is appended) so the
   * UI can render an actionable card — e.g. a recharge button for a wallet
   * shortfall — instead of an inert warning line.
   */
  failure?: ChatMessageFailure;
}

/** Actionable failure attached to a chat message. */
export interface ChatMessageFailure {
  kind: 'insufficient_balance' | 'generic';
  /** Localized, already-resolved message text. */
  text: string;
  /** Backend problem code, retained for diagnostics/reporting. */
  code?: number | string;
  traceId?: string;
  /** Optional funding entry point supplied by the backend. */
  action?: { kind?: string; href?: string; label?: string };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  version: string;
  projectId?: string;
  pinned?: boolean;
  userStateVersion?: string;
}
