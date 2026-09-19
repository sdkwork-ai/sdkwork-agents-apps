import {
  completeAgentTurnStream,
  type CreateAgentTurnRequest,
  type SdkworkAgentsAppClient,
} from "@sdkwork/agents-mp-core/sdk";
import { sha256Hash, uuid } from "@sdkwork/utils";

import {
  type AgentsMpConversationMessage,
  type AgentsMpConversationMessagePage,
  type AgentsMpConversationSession,
  type AgentsMpConversationStreamHandlers,
  type AgentsMpConversationToolCall,
  type AgentsMpConversationTurnResult,
} from "../types/conversationModels";

/**
 * Conversation orchestration for the Agents mini program.
 *
 * Mirrors the PC and H5 conversation contracts so every client root exposes the
 * same session management and streaming behavior. The SDK client and the agent
 * provisioning port are injected by the composition root; this service never
 * constructs transport and never creates agent records itself
 * (`MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md` section 4,
 * `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 5).
 */

/** Agent id of the built-in conversational assistant (shared by all roots). */
export const AGENTS_MP_DEFAULT_CONVERSATION_AGENT_ID = "agent.chat.default";

/** Entry surface recorded on sessions created by this root. */
export const AGENTS_MP_CONVERSATION_ENTRY_SURFACE = "mini_program" as const;

/** Matches the bounded server context window for one interactive session page. */
const SESSION_ITEM_PAGE_SIZE = 50;

const AGENT_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Agent provisioning port, implemented by the agents capability
 * (`@sdkwork/agents-mp-agents`). Keeping it abstract means the conversation
 * package has no compile-time dependency on a sibling capability.
 */
export interface AgentsMpConversationAgentPort {
  /** Returns the built-in assistant id, creating the record when absent. */
  ensureAgent(model?: string): Promise<string>;
  /** Optional built-in assistant model sync (requires `ai.agents.manage`). */
  updateAgentModel?(agentId: string, model: string): Promise<void>;
}

/** Raw record shapes; kept structural because the transport DTO is generator-owned. */
export interface AgentsMpRawSessionRecord {
  readonly sessionId?: string;
  readonly title?: string | null;
  readonly updatedAt?: string;
  readonly status?: string;
  readonly version?: string;
}

export interface AgentsMpRawSessionItemRecord {
  readonly itemId?: string;
  readonly kind?: string;
  readonly content?: string | null;
  readonly sequence?: string;
  readonly createdAt?: string;
  readonly toolCallId?: string | null;
  readonly toolName?: string | null;
  readonly toolArguments?: Record<string, unknown>;
  readonly toolResult?: Record<string, unknown>;
}

function parseTimestamp(value: string | undefined): number {
  if (!value) {
    return Date.now();
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function mapAgentsMpSession(
  record: AgentsMpRawSessionRecord,
): AgentsMpConversationSession | null {
  const id = record.sessionId;
  if (typeof id !== "string" || id.length === 0) {
    return null;
  }
  return {
    id,
    title: record.title?.trim() || "New chat",
    updatedAt: parseTimestamp(record.updatedAt),
    version: record.version ?? "0",
  };
}

/** Compares two Int64String cursors without widening them to `number`. */
function compareInt64String(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  try {
    const leftValue = BigInt(left);
    const rightValue = BigInt(right);
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
    return 0;
  } catch {
    return left.localeCompare(right);
  }
}

function sessionItemKindOrder(kind: string): number {
  switch (kind) {
    case "user_input":
      return 10;
    case "system_instruction":
    case "status_notice":
      return 15;
    case "assistant_output":
    case "reasoning":
      return 20;
    case "tool_call":
      return 30;
    case "tool_result":
      return 40;
    case "error_notice":
      return 50;
    default:
      return 60;
  }
}

export function toAgentsMpMessageRole(
  kind: string | undefined,
): AgentsMpConversationMessage["role"] {
  if (kind === "user_input") return "user";
  if (kind === "system_instruction" || kind === "status_notice" || kind === "error_notice") {
    return "system";
  }
  if (kind === "tool_call" || kind === "tool_result") return "tool";
  return "assistant";
}

function toAgentsMpMessage(
  record: AgentsMpRawSessionItemRecord,
): AgentsMpConversationMessage | null {
  const id = record.itemId;
  if (typeof id !== "string" || id.length === 0) {
    return null;
  }
  return {
    id,
    role: toAgentsMpMessageRole(record.kind),
    text: record.content ?? "",
    ...(record.createdAt ? { createdAt: record.createdAt } : {}),
  };
}

/**
 * Folds `reasoning` items and `tool_call`/`tool_result` pairs into the following
 * assistant message, then orders the transcript the same way the PC and H5
 * roots do (sequence is authoritative).
 */
export function normalizeAgentsMpMessages(
  records: readonly AgentsMpRawSessionItemRecord[],
): AgentsMpConversationMessage[] {
  const ordered = [...records].sort((left, right) => {
    const sequenceOrder = compareInt64String(left.sequence ?? "0", right.sequence ?? "0");
    if (sequenceOrder !== 0) return sequenceOrder;
    const createdAtOrder = (left.createdAt ?? "").localeCompare(right.createdAt ?? "");
    if (createdAtOrder !== 0) return createdAtOrder;
    return sessionItemKindOrder(left.kind ?? "") - sessionItemKindOrder(right.kind ?? "");
  });

  const messages: AgentsMpConversationMessage[] = [];
  let pendingReasoning = "";
  const pendingToolCalls: AgentsMpConversationToolCall[] = [];
  const toolCallsById = new Map<string, AgentsMpConversationToolCall>();

  for (const record of ordered) {
    if (record.kind === "reasoning") {
      pendingReasoning += record.content ?? "";
      continue;
    }
    if (record.kind === "tool_call" || record.kind === "tool_result") {
      const toolCallId = record.toolCallId;
      if (typeof toolCallId !== "string" || toolCallId.length === 0) {
        continue;
      }
      let call = toolCallsById.get(toolCallId);
      if (!call) {
        call = { id: toolCallId, name: record.toolName ?? undefined, status: "running" };
        toolCallsById.set(toolCallId, call);
        pendingToolCalls.push(call);
      }
      if (record.kind === "tool_call") {
        if (!call.name && record.toolName) call.name = record.toolName;
        call.arguments = record.toolArguments
          ? JSON.stringify(record.toolArguments)
          : call.arguments;
        continue;
      }
      const result = record.toolResult ?? {};
      const resultContent = typeof result.content === "string" ? result.content : undefined;
      if (result.status === "succeeded") {
        call.status = "completed";
      } else {
        call.status = "error";
        call.error = resultContent ?? String(result.status);
      }
      continue;
    }

    const message = toAgentsMpMessage(record);
    if (!message) continue;
    if (message.role === "assistant" && pendingReasoning.length > 0) {
      message.reasoning = pendingReasoning;
      pendingReasoning = "";
    }
    if (message.role === "assistant" && pendingToolCalls.length > 0) {
      message.toolCalls = [...pendingToolCalls];
      pendingToolCalls.length = 0;
      toolCallsById.clear();
    }
    messages.push(message);
  }

  return messages;
}

export interface AgentsMpConversationTurnInput {
  readonly sessionId: string;
  readonly content: string;
  readonly model?: string;
  readonly systemPrompt?: string;
  readonly wireProtocol?: CreateAgentTurnRequest["wireProtocol"];
}

export interface AgentsMpConversationService {
  /** Resolves the runtime model id used when the caller supplies none. */
  resolveDefaultModel(preferred?: string): Promise<string>;
  listSessions(): Promise<AgentsMpConversationSession[]>;
  createSession(title: string): Promise<AgentsMpConversationSession>;
  renameSession(sessionId: string, title: string): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  listMessages(sessionId: string, cursor?: string): Promise<AgentsMpConversationMessagePage>;
  /** Streams one turn; deltas arrive through `handlers`. */
  streamTurn(
    input: AgentsMpConversationTurnInput,
    handlers: AgentsMpConversationStreamHandlers,
  ): Promise<AgentsMpConversationTurnResult>;
}

export function createAgentsMpConversationService(
  client: SdkworkAgentsAppClient,
  agentPort: AgentsMpConversationAgentPort,
): AgentsMpConversationService {
  let cachedAgentId: string | null = null;
  let agentCacheExpiresAt = 0;

  async function resolveDefaultModel(preferred?: string): Promise<string> {
    const catalog = await client.ai.agents.agentEngines.list();
    const models = catalog.engines.flatMap((engine) => engine.models);
    if (models.length === 0) {
      throw new Error("Agent engine runtime catalog is unavailable.");
    }
    if (preferred) {
      const exact = models.find((model) => model.modelId === preferred);
      if (exact) return exact.modelId;
    }
    const engineDefault = models.find((model) => model.defaultForEngine);
    return (engineDefault ?? models[0]).modelId;
  }

  async function resolveAgentId(): Promise<string> {
    const now = Date.now();
    if (cachedAgentId && agentCacheExpiresAt > now) {
      return cachedAgentId;
    }
    const resolved = await agentPort.ensureAgent();
    cachedAgentId = resolved;
    agentCacheExpiresAt = now + AGENT_CACHE_TTL_MS;
    return resolved;
  }

  async function createSession(title: string): Promise<AgentsMpConversationSession> {
    const agentId = await resolveAgentId();
    const normalizedTitle = title.trim() || "New chat";
    const session = await client.ai.agents.sessions.create(agentId, {
      sessionKind: "assistant",
      entrySurface: AGENTS_MP_CONVERSATION_ENTRY_SURFACE,
      title: normalizedTitle,
      idempotencyKey: uuid(),
      payloadHash: `sha256:${sha256Hash(JSON.stringify({
        sessionKind: "assistant",
        entrySurface: AGENTS_MP_CONVERSATION_ENTRY_SURFACE,
        title: normalizedTitle,
      }))}`,
      requestedAt: new Date().toISOString(),
    });
    const mapped = mapAgentsMpSession(session as AgentsMpRawSessionRecord);
    if (!mapped) {
      throw new Error("Chat session create did not return sessionId.");
    }
    return mapped;
  }

  return {
    resolveDefaultModel,

    async listSessions() {
      const agentId = await resolveAgentId();
      const response = await client.ai.agents.sessions.list(agentId, { pageSize: 50 });
      return (response.items as AgentsMpRawSessionRecord[])
        .map(mapAgentsMpSession)
        .filter((session): session is AgentsMpConversationSession => session !== null)
        .sort((left, right) => right.updatedAt - left.updatedAt);
    },

    createSession,

    async renameSession(sessionId, title) {
      const agentId = await resolveAgentId();
      await client.ai.agents.sessions.update(agentId, sessionId, { title });
    },

    async deleteSession(sessionId) {
      const agentId = await resolveAgentId();
      await client.ai.agents.sessions.delete(agentId, sessionId);
    },

    async listMessages(sessionId, cursor) {
      const agentId = await resolveAgentId();
      const response = await client.ai.agents.sessionItems.list(agentId, sessionId, {
        ...(cursor ? { cursor } : {}),
        pageSize: SESSION_ITEM_PAGE_SIZE,
        sort: "-sequence",
      });
      return {
        items: normalizeAgentsMpMessages(response.items as AgentsMpRawSessionItemRecord[]),
        hasMore: response.pageInfo.hasMore === true,
        ...(response.pageInfo.nextCursor ? { nextCursor: response.pageInfo.nextCursor } : {}),
      };
    },

    async streamTurn(input, handlers) {
      const agentId = await resolveAgentId();
      const requestId = uuid();
      const runtimeModel = await resolveDefaultModel(input.model);
      const contentType = "text/plain";
      const payloadHash = `sha256:${sha256Hash(JSON.stringify({
        content: input.content.trim(),
        contentType,
        requestedModelId: runtimeModel,
      }))}`;
      const body: CreateAgentTurnRequest = {
        content: input.content.trim(),
        contentType,
        turnMode: "interactive",
        ...(input.systemPrompt ? { systemPrompt: input.systemPrompt.trim() } : {}),
        ...(input.wireProtocol ? { wireProtocol: input.wireProtocol } : {}),
        requestedAt: new Date().toISOString(),
        idempotencyKey: requestId,
        payloadHash,
        clientRequestId: requestId,
        requestedModelId: runtimeModel,
      };
      const completion = await completeAgentTurnStream(
        client,
        agentId,
        input.sessionId,
        body,
        {
          ...(handlers.onDelta ? { onDelta: handlers.onDelta } : {}),
          ...(handlers.onReasoning ? { onReasoning: handlers.onReasoning } : {}),
          ...(handlers.onToolEvent
            ? { onToolEvent: (event) => handlers.onToolEvent?.(event) }
            : {}),
        },
      );
      const items = completion.items as AgentsMpRawSessionItemRecord[];
      for (let index = items.length - 1; index >= 0; index -= 1) {
        const item = items[index];
        if (item.kind === "assistant_output" && item.itemId) {
          return { id: item.itemId, content: item.content ?? "" };
        }
      }
      throw new Error("Agent turn stream did not return an assistant_output item.");
    },
  };
}
