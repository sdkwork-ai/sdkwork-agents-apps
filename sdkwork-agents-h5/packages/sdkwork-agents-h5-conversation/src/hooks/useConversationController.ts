/**
 * Conversation controller.
 *
 * Owns the session list, the active transcript, and the streaming turn
 * lifecycle. All persistence goes through `ConversationService`; the component
 * tree only renders this state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ConversationService,
  DEFAULT_CONVERSATION_SCOPE,
} from "../services/ConversationService";
import { getConversationPort, isConversationPortConfigured } from "../services/conversationPort";
import { translateAgentsConversationText } from "../i18n";
import { classifyConversationFailure } from "../utils/conversationFailure";
import type {
  ConversationMessage,
  ConversationScope,
  ConversationSession,
  ConversationToolCall,
  ConversationToolStreamEvent,
} from "../types";

export interface UseConversationControllerOptions {
  /** Agent scope; defaults to the built-in conversational assistant. */
  scope?: ConversationScope;
  /** Explicit runtime model id; resolved through the port when omitted. */
  model?: string;
  /** Session to open first; defaults to the most recent one. */
  initialSessionId?: string;
  /** Called after a session list change so the host can refresh derived state. */
  onSessionsChanged?: (sessions: ConversationSession[]) => void;
}

export interface ConversationController {
  sessions: ConversationSession[];
  activeSessionId: string | null;
  messages: ConversationMessage[];
  loadingSessions: boolean;
  loadingMessages: boolean;
  sending: boolean;
  error: string | null;
  hasMoreHistory: boolean;
  send: (text: string) => Promise<void>;
  stop: () => void;
  newSession: () => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  reload: () => Promise<void>;
  dismissError: () => void;
}

let localMessageSequence = 0;

function nextLocalMessageId(prefix: string): string {
  localMessageSequence += 1;
  return `${prefix}.${Date.now().toString(36)}.${localMessageSequence.toString(36)}`;
}

function applyToolEvent(
  toolCalls: ConversationToolCall[],
  event: ConversationToolStreamEvent,
): ConversationToolCall[] {
  const id = event.toolCallId ?? `tool.${toolCalls.length}`;
  const existingIndex = toolCalls.findIndex((call) => call.id === id);
  const existing = existingIndex >= 0 ? toolCalls[existingIndex] : undefined;
  const merged: ConversationToolCall = {
    id,
    name: event.toolName ?? existing?.name,
    status:
      event.phase === "stop" ? (event.isError ? "error" : "completed") : "running",
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

export function useConversationController(
  options: UseConversationControllerOptions = {},
): ConversationController {
  const scope = useMemo<ConversationScope>(
    () => options.scope ?? DEFAULT_CONVERSATION_SCOPE,
    [options.scope],
  );

  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    options.initialSessionId ?? null,
  );
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [resolvedModel, setResolvedModel] = useState<string | null>(options.model ?? null);

  const abortRef = useRef<AbortController | null>(null);
  const bootstrappedRef = useRef(false);
  const activeSessionRef = useRef<string | null>(activeSessionId);
  activeSessionRef.current = activeSessionId;

  const publishSessions = useCallback(
    (next: ConversationSession[]) => {
      setSessions(next);
      options.onSessionsChanged?.(next);
    },
    [options],
  );

  const resolveModel = useCallback(async (): Promise<string> => {
    if (options.model) {
      return options.model;
    }
    if (resolvedModel !== null) {
      return resolvedModel;
    }
    const model = await getConversationPort().resolveDefaultModel();
    setResolvedModel(model);
    return model;
  }, [options.model, resolvedModel]);

  const openSession = useCallback(
    async (sessionId: string) => {
      setActiveSessionId(sessionId);
      setLoadingMessages(true);
      setError(null);
      try {
        const page = await ConversationService.loadSessionDetail(sessionId, scope);
        setMessages(page.messages);
        setNextCursor(page.nextCursor);
      } catch {
        setMessages([]);
        setError(translateAgentsConversationText("agents.conversation.error.loadMessages"));
      } finally {
        setLoadingMessages(false);
      }
    },
    [scope],
  );

  const bootstrap = useCallback(async () => {
    if (!isConversationPortConfigured()) {
      setLoadingSessions(false);
      setError(translateAgentsConversationText("agents.conversation.error.loadSessions"));
      return;
    }
    setLoadingSessions(true);
    setError(null);
    try {
      const model = await resolveModel();
      const loaded = await ConversationService.loadSessions(model, scope);
      publishSessions(loaded);
      const preferred =
        options.initialSessionId && loaded.some((entry) => entry.id === options.initialSessionId)
          ? options.initialSessionId
          : loaded[0]?.id;
      if (preferred) {
        await openSession(preferred);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch {
      setError(translateAgentsConversationText("agents.conversation.error.loadSessions"));
    } finally {
      setLoadingSessions(false);
    }
  }, [openSession, options.initialSessionId, publishSessions, resolveModel, scope]);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }
    bootstrappedRef.current = true;
    void bootstrap();
  }, [bootstrap]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
  }, []);

  const newSession = useCallback(async () => {
    stop();
    setError(null);
    try {
      const model = await resolveModel();
      const created = await ConversationService.createSession(
        model,
        translateAgentsConversationText("agents.conversation.sessions.untitled"),
        scope,
      );
      publishSessions([created, ...sessions.filter((entry) => entry.id !== created.id)]);
      setActiveSessionId(created.id);
      setMessages([]);
      setNextCursor(undefined);
    } catch {
      setError(translateAgentsConversationText("agents.conversation.error.send"));
    }
  }, [publishSessions, resolveModel, scope, sessions, stop]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || sending) {
        return;
      }
      const userMessage: ConversationMessage = {
        id: nextLocalMessageId("user"),
        role: "user",
        text: content,
      };
      const assistantMessage: ConversationMessage = {
        id: nextLocalMessageId("assistant"),
        role: "assistant",
        text: "",
        streaming: true,
      };

      let sessionId = activeSessionRef.current;
      setError(null);
      setSending(true);

      try {
        const model = await resolveModel();
        if (!sessionId) {
          const created = await ConversationService.createSession(
            model,
            content.slice(0, 24),
            scope,
          );
          sessionId = created.id;
          publishSessions([created, ...sessions]);
          setActiveSessionId(created.id);
        }
        setMessages((current) => [...current, userMessage, assistantMessage]);

        const controller = new AbortController();
        abortRef.current = controller;

        await ConversationService.streamChat({
          sessionId,
          model,
          messages: [userMessage],
          scope,
          signal: controller.signal,
          onMessageUpdate: (delta) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, text: `${message.text}${delta}` }
                  : message,
              ),
            );
          },
          onReasoning: (delta) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, reasoning: `${message.reasoning ?? ""}${delta}` }
                  : message,
              ),
            );
          },
          onToolEvent: (event) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, toolCalls: applyToolEvent(message.toolCalls ?? [], event) }
                  : message,
              ),
            );
          },
          onError: (failure) => {
            // A wallet shortfall is the one common failure the user can fix, so
            // it is attached as structured state and rendered as an actionable
            // card. Everything else keeps the plain localized message.
            const kind = classifyConversationFailure(failure);
            if (kind === 'insufficient_balance') {
              const balanceText = translateAgentsConversationText(
                'agents.conversation.error.insufficientBalance',
              );
              setMessages((current) =>
                current.map((message) =>
                  message.id === assistantMessage.id
                    ? {
                        ...message,
                        streaming: false,
                        failure: {
                          kind,
                          text: balanceText,
                          code: failure.code,
                          traceId: failure.traceId,
                          action: failure.action,
                        },
                      }
                    : message,
                ),
              );
              setError(balanceText);
              return;
            }
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? {
                      ...message,
                      streaming: false,
                      error:
                        failure.message ||
                        translateAgentsConversationText("agents.conversation.error.send"),
                    }
                  : message,
              ),
            );
            setError(
              failure.message || translateAgentsConversationText("agents.conversation.error.send"),
            );
          },
        });
      } catch {
        setMessages((current) =>
          current.filter((message) => message.id !== assistantMessage.id),
        );
        setError(translateAgentsConversationText("agents.conversation.error.send"));
      } finally {
        abortRef.current = null;
        setSending(false);
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id ? { ...message, streaming: false } : message,
          ),
        );
        // A turn changes `updatedAt`, so refresh the list ordering once it ends.
        try {
          const refreshed = await ConversationService.loadSessions(
            await resolveModel(),
            scope,
          );
          publishSessions(refreshed);
        } catch {
          // Ordering refresh is best-effort; the transcript is already current.
        }
      }
    },
    [publishSessions, resolveModel, scope, sending, sessions],
  );

  const renameSession = useCallback(
    async (sessionId: string, title: string) => {
      try {
        await ConversationService.renameSession(sessionId, title, scope);
        publishSessions(
          sessions.map((entry) => (entry.id === sessionId ? { ...entry, title } : entry)),
        );
      } catch {
        setError(translateAgentsConversationText("agents.conversation.error.loadSessions"));
      }
    },
    [publishSessions, scope, sessions],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await ConversationService.deleteSession(sessionId, scope);
        const remaining = sessions.filter((entry) => entry.id !== sessionId);
        publishSessions(remaining);
        if (activeSessionRef.current === sessionId) {
          setMessages([]);
          setNextCursor(undefined);
          setActiveSessionId(remaining[0]?.id ?? null);
          if (remaining[0]) {
            await openSession(remaining[0].id);
          }
        }
      } catch {
        setError(translateAgentsConversationText("agents.conversation.error.loadSessions"));
      }
    },
    [openSession, publishSessions, scope, sessions],
  );

  const loadOlderMessages = useCallback(async () => {
    const sessionId = activeSessionRef.current;
    if (!sessionId || !nextCursor) {
      return;
    }
    setLoadingMessages(true);
    try {
      const page = await ConversationService.loadSessionDetail(sessionId, scope, nextCursor);
      setMessages((current) => [...page.messages, ...current]);
      setNextCursor(page.nextCursor);
    } catch {
      setError(translateAgentsConversationText("agents.conversation.error.loadMessages"));
    } finally {
      setLoadingMessages(false);
    }
  }, [nextCursor, scope]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    sessions,
    activeSessionId,
    messages,
    loadingSessions,
    loadingMessages,
    sending,
    error,
    hasMoreHistory: Boolean(nextCursor),
    send,
    stop,
    newSession,
    selectSession: openSession,
    renameSession,
    deleteSession,
    loadOlderMessages,
    reload: bootstrap,
    dismissError,
  };
}
