import {
  completeAgentTurn,
  completeAgentTurnStream,
} from "@sdkwork/agents-h5-core/sdk/agentsAppSdkClient";
import {
  getAgentsAppSdkClientWithSession,
  type AgentSessionItemRecord,
  type AgentSessionRecord,
  type CreateAgentTurnRequest,
  type SdkworkAgentsAppClient,
  type TurnRichToolEvent,
} from "@sdkwork/agents-h5-core/sdk/agentsAppSdkClient";
import { sha256Hash, uuid } from "@sdkwork/utils";
import { MAX_LIST_PAGE_SIZE, toOffsetPageInfo, type OffsetPageInfo } from "@sdkwork/agents-h5-core/sdk/pagination";

import { resolveChatRuntimeModel } from "./RuntimeCatalogService";
import { sortSessionItems } from "./sessionMessageOrdering";

/** LLM wire protocol accepted by the cloudrouter gateway for one chat turn. */
export type AgentTurnWireProtocol = NonNullable<CreateAgentTurnRequest["wireProtocol"]>;

/** One tool/skill/MCP invocation folded from a ToolCall/ToolResult item pair. */
export interface ChatToolCall {
  id: string;
  name?: string;
  status: "running" | "completed" | "error";
  arguments?: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  /** Reasoning/thinking text for this assistant turn (collapsible block). */
  reasoning?: string;
  /** Tool/skill/MCP invocations performed within this turn. */
  toolCalls?: ChatToolCall[];
  createdAt: string;
}

export interface ChatMessageListPage {
  items: ChatMessage[];
  pageInfo: OffsetPageInfo;
}

/** Session list row (rename/delete/new-chat ordering all key off this). */
export interface ChatSessionSummary {
  id: string;
  title: string;
  updatedAt: string;
  version: string;
}

/** Transcript ordering for one interactive session page. */
export type ChatMessageSort = "sequence" | "-sequence";

/** Matches the bounded server context window for one interactive session page. */
const SESSION_ITEM_PAGE_SIZE = 50;

function toChatMessage(record: AgentSessionItemRecord): ChatMessage {
  if (!record.itemId) {
    throw new Error("Agent session item did not include itemId.");
  }

  const role: ChatMessage["role"] = record.kind === "user_input"
    ? "user"
    : record.kind === "system_instruction"
        || record.kind === "status_notice"
        || record.kind === "error_notice"
      ? "system"
      : record.kind === "tool_call" || record.kind === "tool_result"
        ? "tool"
        : "assistant";

  return {
    id: record.itemId,
    role,
    content: record.content ?? "",
    createdAt: record.createdAt,
  };
}

function toSessionId(record: AgentSessionRecord): string {
  return record.sessionId;
}

function findAssistantOutput(
  items: AgentSessionItemRecord[],
): AgentSessionItemRecord | undefined {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (item.kind === "assistant_output") {
      return item;
    }
  }
  return undefined;
}

/**
 * Folds `reasoning` items and `tool_call`/`tool_result` pairs into the following
 * assistant message so a reloaded transcript renders exactly what the live
 * stream produced (collapsible thinking block + tool cards).
 *
 * Reasoning items are standalone rows whose `content` accumulates; folding them
 * keeps the persisted transcript shape unchanged (index-based server
 * reconciliation depends on it).
 */
function mergeReasoningIntoAssistantMessages(
  items: AgentSessionItemRecord[],
): ChatMessage[] {
  const messages: ChatMessage[] = [];
  let pendingReasoning = "";
  const pendingToolCalls: ChatToolCall[] = [];
  const toolCallsById = new Map<string, ChatToolCall>();

  for (const item of items) {
    if (item.kind === "reasoning") {
      pendingReasoning += item.content ?? "";
      continue;
    }
    if (item.kind === "tool_call" || item.kind === "tool_result") {
      const toolCallId = item.toolCallId;
      if (!toolCallId) {
        continue;
      }
      let call = toolCallsById.get(toolCallId);
      if (!call) {
        call = {
          id: toolCallId,
          name: item.toolName ?? undefined,
          status: "running",
        };
        toolCallsById.set(toolCallId, call);
        pendingToolCalls.push(call);
      }
      if (item.kind === "tool_call") {
        if (!call.name && item.toolName) {
          call.name = item.toolName;
        }
        call.arguments = item.toolArguments
          ? JSON.stringify(item.toolArguments)
          : call.arguments;
        continue;
      }
      const result = item.toolResult ?? {};
      const resultContent =
        typeof result.content === "string" ? result.content : undefined;
      if (result.status === "succeeded") {
        call.status = "completed";
      } else {
        call.status = "error";
        call.error = resultContent ?? String(result.status);
      }
      continue;
    }

    const message = toChatMessage(item);
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

function toSessionSummary(record: AgentSessionRecord, fallbackTitle: string): ChatSessionSummary {
  return {
    id: toSessionId(record),
    title: record.title ?? fallbackTitle,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export class AgentChatService {
  constructor(
    private readonly getClient: () => SdkworkAgentsAppClient = getAgentsAppSdkClientWithSession,
  ) {}

  async createSessionSummary(agentId: string, title?: string): Promise<ChatSessionSummary> {
    const idempotencyKey = uuid();
    const normalizedTitle = title?.trim() || "Agent session";
    const session = await this.getClient().ai.agents.sessions.create(agentId, {
      sessionKind: "assistant",
      entrySurface: "h5",
      title: normalizedTitle,
      idempotencyKey,
      payloadHash: `sha256:${sha256Hash(JSON.stringify({
        sessionKind: "assistant",
        entrySurface: "h5",
        title: normalizedTitle,
      }))}`,
      requestedAt: new Date().toISOString(),
    });
    const sessionId = toSessionId(session);
    if (!sessionId) {
      throw new Error("Chat session create did not return sessionId.");
    }
    return toSessionSummary(session, normalizedTitle);
  }

  async createSession(agentId: string, title?: string): Promise<string> {
    const summary = await this.createSessionSummary(agentId, title);
    return summary.id;
  }

  async listSessions(agentId: string, pageSize = 10): Promise<string[]> {
    const response = await this.getClient().ai.agents.sessions.list(agentId, { pageSize });
    return (response.items as AgentSessionRecord[])
      .map(toSessionId)
      .filter((sessionId) => sessionId.length > 0);
  }

  /** Session rows for the mobile session sheet (rename / delete / switch). */
  async listSessionSummaries(agentId: string, pageSize = 50): Promise<ChatSessionSummary[]> {
    const response = await this.getClient().ai.agents.sessions.list(agentId, { pageSize });
    return (response.items as AgentSessionRecord[])
      .map((record) => toSessionSummary(record, "New chat"))
      .filter((session) => session.id.length > 0);
  }

  /** Rename (or move) one session; returns the refreshed summary. */
  async updateSession(
    agentId: string,
    sessionId: string,
    patch: { title?: string; projectId?: string; clearProject?: boolean; expectedVersion?: string },
  ): Promise<ChatSessionSummary> {
    const record = await this.getClient().ai.agents.sessions.update(agentId, sessionId, patch);
    return toSessionSummary(record, "New chat");
  }

  /** Soft delete one session. */
  async deleteSession(agentId: string, sessionId: string): Promise<void> {
    await this.getClient().ai.agents.sessions.delete(agentId, sessionId);
  }

  /** Reuse the latest active session when present; otherwise create one. */
  async resolveOrCreateSession(agentId: string, title?: string): Promise<string> {
    const response = await this.getClient().ai.agents.sessions.list(agentId, {
      pageSize: 10,
    });
    const sessions = response.items as AgentSessionRecord[];
    const reusable = sessions.find((session) => {
      return session.status === "active";
    });
    if (reusable) {
      const sessionId = toSessionId(reusable);
      if (sessionId) {
        return sessionId;
      }
    }
    return this.createSession(agentId, title);
  }

  /**
   * Load one server page for interactive chat history (`PAGINATION_SPEC.md` §8).
   *
   * `sort` is optional so the legacy ascending pager keeps its behavior; the
   * interactive conversation surface passes `"-sequence"` and pages backwards
   * through `pageInfo.nextCursor` instead of draining every page upfront.
   */
  async listMessagesPage(
    agentId: string,
    sessionId: string,
    cursor?: string,
    sort?: ChatMessageSort,
  ): Promise<ChatMessageListPage> {
    const response = await this.getClient().ai.agents.sessionItems.list(agentId, sessionId, {
      ...(cursor ? { cursor } : {}),
      pageSize: SESSION_ITEM_PAGE_SIZE,
      ...(sort ? { sort } : {}),
    });
    return {
      items: this.normalizeMessages(response.items as AgentSessionItemRecord[]),
      pageInfo: toOffsetPageInfo(response.pageInfo),
    };
  }

  /** One newest-first page of the interactive transcript (PC-parity window). */
  async listRecentMessagesPage(
    agentId: string,
    sessionId: string,
    cursor?: string,
  ): Promise<ChatMessageListPage> {
    return this.listMessagesPage(agentId, sessionId, cursor, "-sequence");
  }

  /** Load the newest transcript window (last offset page when history spans multiple pages). */
  async loadRecentMessages(agentId: string, sessionId: string): Promise<ChatMessageListPage> {
    let page = await this.listMessagesPage(agentId, sessionId);
    for (
      let guard = 0;
      guard < MAX_LIST_PAGE_SIZE && page.pageInfo.hasMore && page.pageInfo.nextCursor;
      guard += 1
    ) {
      page = await this.listMessagesPage(agentId, sessionId, page.pageInfo.nextCursor);
    }
    return page;
  }

  async listMessages(agentId: string, sessionId: string): Promise<ChatMessage[]> {
    const page = await this.loadRecentMessages(agentId, sessionId);
    return page.items;
  }

  async sendMessage(
    agentId: string,
    sessionId: string,
    content: string,
    modelId?: string,
    systemPrompt?: string,
    wireProtocol?: AgentTurnWireProtocol,
  ): Promise<ChatMessage> {
    const completion = await completeAgentTurn(
      this.getClient(),
      agentId,
      sessionId,
      await this.buildTurnBody(content, modelId, systemPrompt, wireProtocol),
    );
    const assistantRecord = findAssistantOutput(completion.items);
    if (!assistantRecord) {
      throw new Error("Agent turn did not return an assistant_output item.");
    }
    return toChatMessage(assistantRecord);
  }

  /**
   * Streams one turn through the SSE protocol: `onDelta` receives incremental
   * text chunks, `onReasoning` receives thinking deltas, `onToolEvent` receives
   * tool/skill/MCP lifecycle events, and the resolved assistant message is
   * returned at the end. Mirrors the PC `sendMessageStream` contract.
   */
  async sendMessageStream(
    agentId: string,
    sessionId: string,
    content: string,
    modelId: string | undefined,
    onDelta: (delta: string) => void,
    systemPrompt?: string,
    onReasoning?: (reasoning: string) => void,
    onToolEvent?: (event: TurnRichToolEvent) => void,
    wireProtocol?: AgentTurnWireProtocol,
  ): Promise<ChatMessage> {
    const completion = await completeAgentTurnStream(
      this.getClient(),
      agentId,
      sessionId,
      await this.buildTurnBody(content, modelId, systemPrompt, wireProtocol),
      { onDelta, onReasoning, onToolEvent },
    );
    const assistantRecord = findAssistantOutput(completion.items);
    if (!assistantRecord) {
      throw new Error("Agent turn stream did not return an assistant_output item.");
    }
    return toChatMessage(assistantRecord);
  }

  private async buildTurnBody(
    content: string,
    modelId?: string,
    systemPrompt?: string,
    wireProtocol?: AgentTurnWireProtocol,
  ): Promise<CreateAgentTurnRequest> {
    const requestId = uuid();
    // Resolve the runtime model id for the turn request. No local provider
    // binding or API key is required: chat turns route through the cloudrouter
    // account-pool gateway using the caller's auth token (sessions that
    // already carry a runtime binding keep the local binding chain).
    const runtimeModel = await resolveChatRuntimeModel(modelId, this.getClient());
    const contentType = "text/plain";
    const payloadHash = `sha256:${sha256Hash(JSON.stringify({
      content: content.trim(),
      contentType,
      requestedModelId: runtimeModel.id,
    }))}`;
    return {
      content: content.trim(),
      contentType,
      turnMode: "interactive" as const,
      ...(systemPrompt ? { systemPrompt: systemPrompt.trim() } : {}),
      ...(wireProtocol ? { wireProtocol } : {}),
      requestedAt: new Date().toISOString(),
      idempotencyKey: requestId,
      payloadHash,
      clientRequestId: requestId,
      requestedModelId: runtimeModel.id,
    };
  }

  private normalizeMessages(items: AgentSessionItemRecord[]): ChatMessage[] {
    return mergeReasoningIntoAssistantMessages(sortSessionItems(items));
  }
}

export let agentChatService = createSdkworkAgentChatService();

let activeChatClientGetter: (() => SdkworkAgentsAppClient) | undefined;

/**
 * Host injection hook for the chat transport (mirrors `configureAgentService`).
 *
 * Host apps such as sdkwork-im-h5 construct their own agents app SDK client
 * (their token manager + gateway root) and inject it here so agent sessions
 * never fall back to the standalone agents-h5 session storage / base URL.
 */
export function configureAgentChatService(
  getClient?: () => SdkworkAgentsAppClient,
): AgentChatService {
  activeChatClientGetter = getClient;
  agentChatService = createSdkworkAgentChatService(getClient);
  return agentChatService;
}

export function createSdkworkAgentChatService(
  getClient?: () => SdkworkAgentsAppClient,
): AgentChatService {
  return new AgentChatService(getClient);
}
