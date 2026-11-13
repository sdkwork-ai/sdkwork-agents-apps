import type { SdkworkAppClient } from "@sdkwork/agents-app-sdk";
import {
  configureAgentService,
  createSdkworkAgentChatService,
  createSdkworkAgentService,
  loadMobileModelCatalog,
  type AgentConfig,
  type AgentChatService,
  type AgentService,
  type AgentTurnWireProtocol,
  type ChatMessage,
  type ChatSessionSummary,
} from "@sdkwork/agents-h5-agents";
import {
  configureAgentsConversationLocale,
  configureConversationPort,
  type AgentsConversationLocale,
  type ConversationMessage,
  type ConversationPort,
  type ConversationSession,
} from "@sdkwork/agents-h5-conversation";

const AGENT_TURN_WIRE_PROTOCOLS = new Set<AgentTurnWireProtocol>([
  "chat_completions",
  "anthropic_messages",
  "google_content",
  "openai_responses",
]);

export interface PlaygroundRuntimeOptions {
  /**
   * Generated Agents app SDK client already bound to the host session (base URL
   * and dual-token manager). The playground must not construct its own client.
   */
  readonly getClient: () => SdkworkAppClient;
  /** Host locale; the conversation surface ships zh-CN and en-US. */
  readonly locale?: string | null;
  /** Caller permission scope, used to gate built-in assistant model sync. */
  readonly readPermissionScope?: () => string[];
}

/**
 * Binds the Playground capability to a host-owned Agents SDK client.
 *
 * Mirrors the H5 app composition root: the client-backed agent services are
 * created here, the shared conversation port is injected, and the conversation
 * locale follows the host. Calling it again with a new client (for example
 * after a token refresh) rebinds the port.
 */
export function configurePlaygroundRuntime({
  getClient,
  locale,
  readPermissionScope,
}: PlaygroundRuntimeOptions): void {
  const agentService = createSdkworkAgentService(getClient);
  const agentChatService = createSdkworkAgentChatService(getClient);
  // The runtime model catalog loader resolves through the configured service.
  configureAgentService(getClient);
  configureConversationPort(
    createPlaygroundConversationPort(agentService, agentChatService, readPermissionScope),
  );
  configureAgentsConversationLocale(normalizeLocale(locale));
}

function normalizeLocale(locale?: string | null): AgentsConversationLocale {
  return locale === "en-US" ? "en-US" : "zh-CN";
}

function toWireProtocol(value?: string): AgentTurnWireProtocol | undefined {
  return value && AGENT_TURN_WIRE_PROTOCOLS.has(value as AgentTurnWireProtocol)
    ? (value as AgentTurnWireProtocol)
    : undefined;
}

function toConversationMessage(message: ChatMessage): ConversationMessage {
  return {
    id: message.id,
    role: message.role,
    text: message.content,
    ...(message.createdAt ? { createdAt: message.createdAt } : {}),
    ...(message.reasoning ? { reasoning: message.reasoning } : {}),
    ...(message.toolCalls?.length ? { toolCalls: message.toolCalls } : {}),
  };
}

function toConversationSession(summary: ChatSessionSummary): ConversationSession {
  const parsed = Date.parse(summary.updatedAt);
  return {
    id: summary.id,
    title: summary.title,
    // The conversation surface sorts by epoch milliseconds.
    updatedAt: Number.isFinite(parsed) ? parsed : Date.now(),
    version: summary.version,
  };
}

function toAgentRecord(agent: AgentConfig | null): {
  id: string;
  name?: string;
  model?: string;
  systemPrompt?: string;
  welcomeMessage?: string;
} | null {
  if (!agent?.id) {
    return null;
  }
  return {
    id: agent.id,
    ...(agent.name ? { name: agent.name } : {}),
    ...(agent.model ? { model: agent.model } : {}),
    ...(agent.systemPrompt ? { systemPrompt: agent.systemPrompt } : {}),
    ...(agent.welcomeMessage ? { welcomeMessage: agent.welcomeMessage } : {}),
  };
}

function createPlaygroundConversationPort(
  agentService: AgentService,
  agentChatService: AgentChatService,
  readPermissionScope?: () => string[],
): ConversationPort {
  return {
    async getAgent(agentId) {
      return toAgentRecord(await agentService.getAgent(agentId));
    },

    async createAgent(draft) {
      const created = await agentService.createAgent({
        id: draft.id,
        name: draft.name,
        description: draft.description,
        type: draft.type,
        model: draft.model,
        systemPrompt: draft.systemPrompt,
        welcomeMessage: draft.welcomeMessage,
      });
      return toAgentRecord(created) ?? { id: draft.id, name: draft.name };
    },

    async updateAgentModel(agentId, model) {
      await agentService.updateAgent(agentId, { model });
    },

    async resolveDefaultModel() {
      const catalog = await loadMobileModelCatalog();
      const preferred = catalog.find((item) => item.defaultForEngine) ?? catalog[0];
      if (!preferred) {
        throw new Error("Agent engine runtime catalog is unavailable.");
      }
      return preferred.id;
    },

    async listSessions(agentId) {
      const sessions = await agentChatService.listSessionSummaries(agentId);
      return sessions.map(toConversationSession);
    },

    async createSession(agentId, title) {
      return toConversationSession(await agentChatService.createSessionSummary(agentId, title));
    },

    async renameSession(agentId, sessionId, title) {
      await agentChatService.updateSession(agentId, sessionId, { title });
    },

    async deleteSession(agentId, sessionId) {
      await agentChatService.deleteSession(agentId, sessionId);
    },

    async listMessagesPage(agentId, sessionId, cursor) {
      const page = await agentChatService.listRecentMessagesPage(agentId, sessionId, cursor);
      return {
        items: page.items.map(toConversationMessage),
        hasMore: page.pageInfo.hasMore,
        ...(page.pageInfo.nextCursor ? { nextCursor: page.pageInfo.nextCursor } : {}),
      };
    },

    async sendTurn(request) {
      const message = await agentChatService.sendMessage(
        request.agentId,
        request.sessionId,
        request.content,
        request.model,
        request.systemPrompt,
        toWireProtocol(request.wireProtocol),
      );
      return { id: message.id, content: message.content };
    },

    async streamTurn(request, handlers) {
      const message = await agentChatService.sendMessageStream(
        request.agentId,
        request.sessionId,
        request.content,
        request.model,
        (delta) => handlers.onDelta?.(delta),
        request.systemPrompt,
        handlers.onReasoning ? (reasoning) => handlers.onReasoning?.(reasoning) : undefined,
        handlers.onToolEvent ? (event) => handlers.onToolEvent?.(event) : undefined,
        toWireProtocol(request.wireProtocol),
      );
      return { id: message.id, content: message.content };
    },

    readPermissionScope() {
      return readPermissionScope?.() ?? [];
    },
  };
}
