import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import {
  MobileResourceList,
  cn,
  formatListTimestamp,
} from "@sdkwork/agents-h5-commons";

import { translateAgentsConversationText } from "../i18n";
import { ConversationService } from "../services/ConversationService";
import {
  getConversationPort,
  isConversationPortConfigured,
} from "../services/conversationPort";
import type { ConversationSession } from "../types";

export interface ConversationHistoryScreenProps {
  /** Opens one session in the chat surface. */
  onOpenSession: (sessionId: string) => void;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

/**
 * Conversation history behind `app.agents.conversation.list`.
 *
 * Sessions come from the injected conversation port; the page never invents a
 * transcript. Deleting a session is two-step so a mis-tap cannot remove a
 * conversation.
 */
export function ConversationHistoryScreen({
  onOpenSession,
  onBack,
  backLabel,
  className,
}: ConversationHistoryScreenProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isConversationPortConfigured()) {
      setLoading(false);
      setError(translateAgentsConversationText("agents.conversation.history.loadFailed"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const model = await getConversationPort().resolveDefaultModel();
      const list = await ConversationService.loadSessions(model);
      setSessions(list);
    } catch {
      setError(translateAgentsConversationText("agents.conversation.history.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return sessions;
    }
    return sessions.filter((session) => session.title.toLowerCase().includes(normalized));
  }, [query, sessions]);

  const handleDelete = useCallback(
    async (sessionId: string) => {
      if (pendingDeleteId !== sessionId) {
        setPendingDeleteId(sessionId);
        return;
      }
      setPendingDeleteId(null);
      try {
        await ConversationService.deleteSession(sessionId);
        setSessions((current) => current.filter((session) => session.id !== sessionId));
      } catch {
        setError(translateAgentsConversationText("agents.conversation.history.deleteFailed"));
      }
    },
    [pendingDeleteId],
  );

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <MobileResourceList
        title={translateAgentsConversationText("agents.mobile.history.title")}
        searchPlaceholder={translateAgentsConversationText("agents.conversation.history.search")}
        searchValue={query}
        onSearchChange={setQuery}
        items={visible}
        keyOf={(session) => session.id}
        loading={loading}
        loadingText={translateAgentsConversationText("agents.conversation.status.loading")}
        errorText={error}
        onRetry={() => void load()}
        emptyText={translateAgentsConversationText("agents.conversation.sessions.empty")}
        {...(onBack ? { onBack } : {})}
        {...(backLabel ? { backLabel } : {})}
        renderRow={(session) => (
          <div className="flex items-center gap-1 rounded-xl bg-[var(--color-surface-color,#FFFFFF)] pr-3">
            <button
              type="button"
              onClick={() => onOpenSession(session.id)}
              aria-label={`${translateAgentsConversationText("agents.conversation.history.open")}: ${session.title}`}
              className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors active:bg-[var(--color-surface-muted,#EAF1FB)]"
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  "bg-[var(--color-primary-subtle,#E8F0FF)]",
                  "text-[var(--color-primary-blue,#165DFF)]",
                )}
                aria-hidden="true"
              >
                #
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] text-[var(--color-text-main,#0A1B3D)]">
                  {session.title ||
                    translateAgentsConversationText("agents.conversation.sessions.untitled")}
                </span>
                <span className="block truncate text-[11px] text-[var(--color-text-sub,#5B6B88)]">
                  {translateAgentsConversationText("agents.conversation.history.updatedAt", {
                    date: formatListTimestamp(session.updatedAt),
                  })}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => void handleDelete(session.id)}
              aria-label={
                pendingDeleteId === session.id
                  ? translateAgentsConversationText("agents.conversation.sessions.confirm")
                  : translateAgentsConversationText("agents.conversation.sessions.delete")
              }
              className={cn(
                "flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-[11px]",
                pendingDeleteId === session.id
                  ? "bg-[var(--color-danger-bg,#FFF1F0)] text-[var(--color-danger,#F53F3F)]"
                  : "text-[var(--color-text-sub,#5B6B88)]",
              )}
            >
              <Trash2 size={14} aria-hidden="true" />
              {pendingDeleteId === session.id
                ? translateAgentsConversationText("agents.conversation.sessions.confirm")
                : null}
            </button>
          </div>
        )}
      />
    </div>
  );
}
