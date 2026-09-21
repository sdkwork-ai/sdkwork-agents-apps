/**
 * Conversation orchestration for the Agents mobile roots.
 *
 * Mirrors the PC `ChatService` contract so every client root exposes the same
 * session-management and streaming behavior, while staying platform-neutral:
 * SDK access happens through the injected `ConversationPort`.
 */

import type {
  ConversationMessage,
  ConversationScope,
  ConversationSendFailure,
  ConversationSession,
  ConversationToolStreamEvent,
} from "../types";
import { trimSessionTitle } from "../utils/sessionTitle";
import {
  getConversationPort,
  type ConversationAgentDraft,
  type ConversationAgentRecord,
} from "./conversationPort";

/** Agent id of the built-in conversational assistant (shared by all roots). */
export const DEFAULT_CONVERSATION_AGENT_ID = "agent.chat.default";

export const DEFAULT_CONVERSATION_SCOPE: ConversationScope = {
  agentId: DEFAULT_CONVERSATION_AGENT_ID,
};

export function createConversationScope(
  agentId: string,
  overrides: Omit<ConversationScope, "agentId"> = {},
): ConversationScope {
  return { agentId, ...overrides };
}

export function isDefaultConversationScope(scope: ConversationScope): boolean {
  return scope.agentId === DEFAULT_CONVERSATION_AGENT_ID;
}

function resolveScope(scope?: ConversationScope): ConversationScope {
  return scope ?? DEFAULT_CONVERSATION_SCOPE;
}

const AGENT_CACHE_TTL_MS = 5 * 60 * 1000;
const agentCacheById = new Map<string, { agent: ConversationAgentRecord | null; expiresAt: number }>();
const resolvedSessionIdBySession = new Map<string, string>();

/** Test-only reset for the module-level session/agent caches. */
export function resetConversationCaches(): void {
  agentCacheById.clear();
  resolvedSessionIdBySession.clear();
}

function defaultAgentDraft(model: string): ConversationAgentDraft {
  return {
    id: DEFAULT_CONVERSATION_AGENT_ID,
    name: "SDKWork Agents",
    description: "SDKWork Agents built-in conversational assistant.",
    type: "normal",
    model,
    systemPrompt: "You are SDKWork Agents. Provide accurate, concise, secure, and useful answers.",
    welcomeMessage: "How can I help?",
  };
}

function canonicalSessionId(sessionId: string): string {
  const normalized = sessionId.trim().toLowerCase().replace(/[^a-z0-9_-]/gu, "-");
  return sessionId.startsWith("session.") ? sessionId : `session.${normalized}`;
}

function isPersistedServerSessionId(sessionId: string): boolean {
  return sessionId.trim().startsWith("session.");
}

function sessionCacheKey(agentId: string, sessionId: string): string {
  return `${agentId}:${sessionId}`;
}

/**
 * Mirrors the backend `IamGatedPolicyProvider` grant rules: updating an agent
 * record requires `ai.agents.manage`, with `ai.*` and `*` wildcards also
 * granting it. Chat-only callers must not attempt the model sync at all.
 */
export function callerScopeGrantsAgentManage(scopes: string[]): boolean {
  return scopes.some(
    (scope) => scope === "ai.agents.manage" || scope === "ai.*" || scope === "*",
  );
}

async function ensureConversationAgent(model: string, scope: ConversationScope): Promise<void> {
  const port = getConversationPort();
  const now = Date.now();
  const cacheKey = scope.agentId;
  const cached = agentCacheById.get(cacheKey);
  const current = cached && cached.expiresAt > now
    ? cached.agent
    : await port.getAgent(scope.agentId);
  agentCacheById.set(cacheKey, { agent: current, expiresAt: now + AGENT_CACHE_TTL_MS });

  if (!isDefaultConversationScope(scope)) {
    if (!current) {
      throw new Error(`Agent ${scope.agentId} is not available.`);
    }
    return;
  }

  if (!current) {
    const created = await port.createAgent(defaultAgentDraft(model));
    agentCacheById.set(cacheKey, { agent: created, expiresAt: now + AGENT_CACHE_TTL_MS });
    return;
  }
  if (model && current.model !== model) {
    if (!callerScopeGrantsAgentManage(port.readPermissionScope())) {
      return;
    }
    try {
      await port.updateAgentModel(DEFAULT_CONVERSATION_AGENT_ID, model);
      agentCacheById.set(cacheKey, {
        agent: { ...current, model },
        expiresAt: now + AGENT_CACHE_TTL_MS,
      });
    } catch (error) {
      console.warn("Failed to sync the built-in assistant model", error);
    }
  }
}

async function resolveSession(
  model: string,
  localSessionId: string,
  scope: ConversationScope,
): Promise<string> {
  await ensureConversationAgent(model, scope);
  const canonical = canonicalSessionId(localSessionId);
  const cacheKey = sessionCacheKey(scope.agentId, canonical);
  const cached = resolvedSessionIdBySession.get(cacheKey);
  if (cached) {
    return cached;
  }
  if (isPersistedServerSessionId(localSessionId)) {
    resolvedSessionIdBySession.set(cacheKey, localSessionId.trim());
    return localSessionId.trim();
  }
  const resolved = await getConversationPort().createSession(
    scope.agentId,
    trimSessionTitle(scope.title ?? "SDKWork Agents"),
  );
  resolvedSessionIdBySession.set(cacheKey, resolved.id);
  return resolved.id;
}

function resolveSystemPrompt(model: string, scope: ConversationScope): string {
  if (scope.systemPrompt?.trim()) {
    return scope.systemPrompt.trim();
  }
  return defaultAgentDraft(model).systemPrompt;
}

function toSendFailure(error: unknown): ConversationSendFailure {
  if (error instanceof Error) {
    const problem = (
      error as {
        problem?: {
          i18nKey?: string;
          code?: number | string;
          failedStage?: string;
          action?: { kind?: string; href?: string; label?: string };
        };
      }
    ).problem;
    return {
      message: error.message,
      i18nKey: problem?.i18nKey,
      code: problem?.code,
      httpStatus: (error as { httpStatus?: number }).httpStatus,
      traceId: (error as { traceId?: string }).traceId,
      failedStage: problem?.failedStage,
      action: problem?.action?.kind
        ? {
            kind: problem.action.kind,
            href: problem.action.href,
            label: problem.action.label,
          }
        : undefined,
    };
  }
  return { message: "Agents conversation request failed." };
}

export interface ConversationStreamOptions {
  sessionId: string;
  model: string;
  /** Transcript so far; the last entry must be the user turn being sent. */
  messages: ConversationMessage[];
  scope?: ConversationScope;
  signal?: AbortSignal;
  /** Optional LLM wire protocol for the cloudrouter gateway. */
  wireProtocol?: string;
  onMessageUpdate: (text: string) => void;
  /** Reasoning/thinking delta streamed for the assistant message. */
  onReasoning?: (reasoning: string) => void;
  /** Tool/skill/MCP invocation lifecycle event for the assistant message. */
  onToolEvent?: (event: ConversationToolStreamEvent) => void;
  onComplete?: (message?: { id: string }) => void;
  onError?: (failure: ConversationSendFailure) => void;
}

export class ConversationService {
  /** Creates a server-backed session immediately (e.g. on "New chat"). */
  static async createSession(
    model: string,
    title?: string,
    scope?: ConversationScope,
  ): Promise<ConversationSession> {
    const resolvedScope = resolveScope(scope);
    await ensureConversationAgent(model, resolvedScope);
    const created = await getConversationPort().createSession(
      resolvedScope.agentId,
      trimSessionTitle(title?.trim() || "New chat"),
    );
    resolvedSessionIdBySession.set(
      sessionCacheKey(resolvedScope.agentId, canonicalSessionId(created.id)),
      created.id,
    );
    return created;
  }

  static async loadSessions(model: string, scope?: ConversationScope): Promise<ConversationSession[]> {
    const resolvedScope = resolveScope(scope);
    await ensureConversationAgent(model, resolvedScope);
    const sessions = await getConversationPort().listSessions(resolvedScope.agentId);
    for (const session of sessions) {
      resolvedSessionIdBySession.set(
        sessionCacheKey(resolvedScope.agentId, canonicalSessionId(session.id)),
        session.id,
      );
    }
    return [...sessions].sort((left, right) => right.updatedAt - left.updatedAt);
  }

  /** Loads one session transcript on demand. */
  static async loadSessionDetail(
    sessionId: string,
    scope?: ConversationScope,
    cursor?: string,
  ): Promise<{ messages: ConversationMessage[]; hasMore: boolean; nextCursor?: string }> {
    const resolvedScope = resolveScope(scope);
    const page = await getConversationPort().listMessagesPage(
      resolvedScope.agentId,
      canonicalSessionId(sessionId),
      cursor,
    );
    return { messages: page.items, hasMore: page.hasMore, nextCursor: page.nextCursor };
  }

  static async renameSession(
    sessionId: string,
    title: string,
    scope?: ConversationScope,
  ): Promise<void> {
    const resolvedScope = resolveScope(scope);
    await getConversationPort().renameSession(
      resolvedScope.agentId,
      canonicalSessionId(sessionId),
      trimSessionTitle(title),
    );
  }

  static async deleteSession(sessionId: string, scope?: ConversationScope): Promise<void> {
    const resolvedScope = resolveScope(scope);
    const canonical = canonicalSessionId(sessionId);
    await getConversationPort().deleteSession(resolvedScope.agentId, canonical);
    resolvedSessionIdBySession.delete(sessionCacheKey(resolvedScope.agentId, canonical));
  }

  /**
   * Streams one assistant turn. Falls back to the non-streaming turn when the
   * port reports no deltas, so a single terminal frame still fills the bubble.
   */
  static async streamChat(options: ConversationStreamOptions): Promise<void> {
    const resolvedScope = resolveScope(options.scope);
    if (!options.sessionId.trim()) {
      options.onError?.({ message: "A chat session is required." });
      return;
    }
    if (options.signal?.aborted) {
      options.onError?.({ message: "AbortError" });
      return;
    }

    const latest = options.messages.at(-1);
    if (!latest || latest.role !== "user") {
      options.onError?.({ message: "A user message is required." });
      return;
    }

    try {
      const sessionId = await resolveSession(options.model, options.sessionId, resolvedScope);
      if (options.signal?.aborted) {
        options.onError?.({ message: "AbortError" });
        return;
      }
      const port = getConversationPort();
      const content = latest.text.trim() || "Attachment";
      const request = {
        agentId: resolvedScope.agentId,
        sessionId,
        content,
        ...(options.model ? { model: options.model } : {}),
        systemPrompt: resolveSystemPrompt(options.model, resolvedScope),
        ...(options.wireProtocol ? { wireProtocol: options.wireProtocol } : {}),
      };
      // The sink contract is delta-shaped, but the cloudrouter account-pool path
      // can answer in one terminal frame with zero deltas. Track whether any
      // delta reached the renderer so the terminal content can be published
      // instead of leaving the assistant bubble empty until a session reload.
      let streamedDelta = false;
      const response = await port.streamTurn(request, {
        onDelta: (delta) => {
          streamedDelta = true;
          options.onMessageUpdate(delta);
        },
        onReasoning: (reasoning) => options.onReasoning?.(reasoning),
        onToolEvent: (event) => options.onToolEvent?.(event),
      });
      if (options.signal?.aborted) {
        options.onError?.({ message: "AbortError" });
        return;
      }
      // Re-emitting after deltas would render the answer twice.
      if (!streamedDelta) {
        options.onMessageUpdate(response.content);
      }
      options.onComplete?.({ id: response.id });
    } catch (error) {
      const failure = toSendFailure(error);
      console.warn(
        `[agents-conversation] turn failed: ${failure.message}`,
        {
          httpStatus: failure.httpStatus,
          i18nKey: failure.i18nKey,
          code: failure.code,
          traceId: failure.traceId,
        },
      );
      options.onError?.(failure);
    }
  }
}
