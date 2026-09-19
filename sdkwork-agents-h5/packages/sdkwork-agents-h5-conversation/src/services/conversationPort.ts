/**
 * Conversation port.
 *
 * Capability packages `MUST NOT` construct or import generated SDK clients
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 1 and 8). The
 * conversation surface therefore receives an injected port that the composition
 * root wires from its SDK-backed capability services.
 */

import type {
  ConversationMessagePage,
  ConversationScope,
  ConversationSession,
  ConversationToolStreamEvent,
  ConversationTurnHandlers,
  ConversationTurnRequest,
  ConversationTurnResult,
} from "../types";

/** Subset of an agent record the conversation surface needs. */
export interface ConversationAgentRecord {
  id: string;
  name?: string;
  model?: string;
  systemPrompt?: string;
  welcomeMessage?: string;
}

/** Built-in conversational assistant definition created on first use. */
export interface ConversationAgentDraft {
  id: string;
  name: string;
  description: string;
  type: "normal";
  model: string;
  systemPrompt: string;
  welcomeMessage: string;
}

export interface ConversationPort {
  getAgent(agentId: string): Promise<ConversationAgentRecord | null>;
  createAgent(draft: ConversationAgentDraft): Promise<ConversationAgentRecord>;
  /** Syncs the built-in assistant model. Requires `ai.agents.manage`. */
  updateAgentModel(agentId: string, model: string): Promise<void>;

  /**
   * Resolves the runtime model id used when the caller supplies none. The port
   * owns model-catalog access so this package stays free of generated SDKs.
   */
  resolveDefaultModel(): Promise<string>;

  listSessions(agentId: string): Promise<ConversationSession[]>;
  createSession(agentId: string, title: string): Promise<ConversationSession>;
  renameSession(agentId: string, sessionId: string, title: string): Promise<void>;
  deleteSession(agentId: string, sessionId: string): Promise<void>;

  listMessagesPage(
    agentId: string,
    sessionId: string,
    cursor?: string,
  ): Promise<ConversationMessagePage>;

  sendTurn(request: ConversationTurnRequest): Promise<ConversationTurnResult>;
  /** Streaming SSE variant; deltas are delivered through `handlers`. */
  streamTurn(
    request: ConversationTurnRequest,
    handlers: ConversationTurnHandlers,
  ): Promise<ConversationTurnResult>;

  /** Caller IAM permission scope, used to gate the built-in assistant sync. */
  readPermissionScope(): string[];
}

let conversationPort: ConversationPort | null = null;

export function configureConversationPort(port: ConversationPort): void {
  conversationPort = port;
}

export function getConversationPort(): ConversationPort {
  if (!conversationPort) {
    throw new Error("Conversation port is not configured.");
  }
  return conversationPort;
}

export function isConversationPortConfigured(): boolean {
  return conversationPort !== null;
}

/** Test-only reset so isolated unit tests can re-wire the port. */
export function resetConversationPort(): void {
  conversationPort = null;
}

export type { ConversationToolStreamEvent };
