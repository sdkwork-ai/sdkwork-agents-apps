import { useCallback, useState } from "react";
import { MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";

import { cn } from "@sdkwork/agents-h5-commons";

import { translateAgentsConversationText } from "../i18n";
import type { ConversationSession } from "../types";

export interface ConversationSessionSheetProps {
  open: boolean;
  sessions: ConversationSession[];
  activeSessionId: string | null;
  loading?: boolean;
  onClose: () => void;
  onSelect: (sessionId: string) => void;
  onCreate: () => void;
  onRename: (sessionId: string, title: string) => void;
  onDelete: (sessionId: string) => void;
}

function formatUpdatedAt(updatedAt: number): string {
  if (!Number.isFinite(updatedAt) || updatedAt <= 0) {
    return "";
  }
  const date = new Date(updatedAt);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const hhmm = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  if (sameDay) {
    return hhmm;
  }
  return `${date.getMonth() + 1}/${date.getDate()} ${hhmm}`;
}

/**
 * Session drawer.
 *
 * Slides over the transcript and owns session selection, rename, delete, and
 * creation so the header only needs a single trigger.
 */
export function ConversationSessionSheet({
  open,
  sessions,
  activeSessionId,
  loading = false,
  onClose,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: ConversationSessionSheetProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const commitRename = useCallback(() => {
    if (editingId && draftTitle.trim()) {
      onRename(editingId, draftTitle.trim());
    }
    setEditingId(null);
    setDraftTitle("");
  }, [draftTitle, editingId, onRename]);

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-30 flex">
      <button
        type="button"
        aria-label={translateAgentsConversationText("agents.conversation.sessions.cancel")}
        onClick={onClose}
        className="h-full flex-1 bg-black/30"
      />
      <aside
        className={cn(
          "flex h-full w-[78%] max-w-[320px] flex-col",
          "bg-[var(--color-surface-color,#ffffff)]",
          "shadow-[0_0_24px_rgba(0,0,0,0.12)]",
        )}
      >
        <div className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
          <h2 className="text-[16px] font-semibold text-[var(--color-text-main,#1f1f1f)]">
            {translateAgentsConversationText("agents.conversation.sessions.title")}
          </h2>
          <button
            type="button"
            aria-label={translateAgentsConversationText("agents.conversation.sessions.cancel")}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-sub,#8c8c8c)] active:scale-95"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onCreate();
            onClose();
          }}
          className={cn(
            "mx-3 mb-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[14px] font-medium",
            "bg-[var(--color-primary-blue,#2b5ce7)] text-white active:scale-[0.99]",
          )}
        >
          <MessageSquarePlus size={17} aria-hidden="true" />
          {translateAgentsConversationText("agents.conversation.actions.newSession")}
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {loading && sessions.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--color-text-sub,#8c8c8c)]">
              {translateAgentsConversationText("agents.conversation.status.loading")}
            </p>
          ) : sessions.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--color-text-sub,#8c8c8c)]">
              {translateAgentsConversationText("agents.conversation.sessions.empty")}
            </p>
          ) : (
            <ul>
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isEditing = editingId === session.id;
                const isPendingDelete = pendingDeleteId === session.id;
                return (
                  <li key={session.id} className="px-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2 px-2 py-2">
                        <input
                          value={draftTitle}
                          autoFocus
                          onChange={(event) => setDraftTitle(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              commitRename();
                            }
                            if (event.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                          className={cn(
                            "min-w-0 flex-1 rounded-lg px-2 py-1.5 text-[14px] outline-none",
                            "bg-[var(--color-bg-color,#f5f5f7)] text-[var(--color-text-main,#1f1f1f)]",
                          )}
                        />
                        <button
                          type="button"
                          onClick={commitRename}
                          className="shrink-0 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[var(--color-primary-blue,#2b5ce7)]"
                        >
                          {translateAgentsConversationText("agents.conversation.sessions.confirm")}
                        </button>
                      </div>
                    ) : isPendingDelete ? (
                      <div className="flex items-center gap-2 px-2 py-2">
                        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-danger,#dc2626)]">
                          {translateAgentsConversationText("agents.conversation.sessions.delete")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(session.id);
                            setPendingDeleteId(null);
                          }}
                          className="shrink-0 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[var(--color-danger,#dc2626)]"
                        >
                          {translateAgentsConversationText("agents.conversation.sessions.confirm")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          className="shrink-0 rounded-lg px-2 py-1.5 text-[13px] text-[var(--color-text-sub,#8c8c8c)]"
                        >
                          {translateAgentsConversationText("agents.conversation.sessions.cancel")}
                        </button>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-xl px-2 py-1",
                          isActive && "bg-[var(--color-hover-bg,rgba(43,92,231,0.08))]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(session.id);
                            onClose();
                          }}
                          className="min-w-0 flex-1 py-2 text-left"
                        >
                          <span className="block truncate text-[14px] text-[var(--color-text-main,#1f1f1f)]">
                            {session.title ||
                              translateAgentsConversationText(
                                "agents.conversation.sessions.untitled",
                              )}
                          </span>
                          <span className="block text-[11px] text-[var(--color-text-sub,#8c8c8c)]">
                            {formatUpdatedAt(session.updatedAt)}
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={translateAgentsConversationText(
                            "agents.conversation.sessions.rename",
                          )}
                          onClick={() => {
                            setEditingId(session.id);
                            setDraftTitle(session.title);
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-sub,#8c8c8c)] active:scale-95"
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={translateAgentsConversationText(
                            "agents.conversation.sessions.delete",
                          )}
                          onClick={() => setPendingDeleteId(session.id)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-sub,#8c8c8c)] active:scale-95"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
