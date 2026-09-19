import { Menu, Plus } from "lucide-react";

import { cn } from "@sdkwork/agents-h5-commons";

import { translateAgentsConversationText } from "../i18n";

export interface ConversationTopBarProps {
  /** Active session title, rendered after the app title as the task switcher. */
  sessionTitle?: string;
  onOpenSessions: () => void;
  onNewSession: () => void;
  className?: string;
}

/**
 * Conversation header.
 *
 * Mirrors the mobile reference: a circular menu trigger on the leading edge, the
 * product title with the active task on the second line, and a trailing
 * new-chat action. The task line is the session switcher.
 */
export function ConversationTopBar({
  sessionTitle,
  onOpenSessions,
  onNewSession,
  className,
}: ConversationTopBarProps) {
  return (
    <header
      className={cn(
        "flex items-center gap-3 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3",
        "bg-[var(--color-bg-color,#f5f5f7)]",
        className,
      )}
    >
      <button
        type="button"
        aria-label={translateAgentsConversationText("agents.conversation.header.menu")}
        onClick={onOpenSessions}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
          "bg-[var(--color-surface-color,#ffffff)] text-[var(--color-text-main,#1f1f1f)]",
          "shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition active:scale-95",
        )}
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-semibold leading-6 text-[var(--color-text-main,#1f1f1f)]">
          {translateAgentsConversationText("agents.conversation.header.title")}
        </h1>
        <button
          type="button"
          onClick={onOpenSessions}
          aria-label={translateAgentsConversationText("agents.conversation.header.switchSession")}
          className={cn(
            "flex max-w-full items-center gap-1 text-[12px] leading-5",
            "text-[var(--color-text-sub,#8c8c8c)]",
          )}
        >
          <span className="truncate">
            {sessionTitle?.trim() ||
              translateAgentsConversationText("agents.conversation.sessions.untitled")}
          </span>
          <span aria-hidden="true" className="shrink-0">
            &gt;
          </span>
        </button>
      </div>

      <button
        type="button"
        aria-label={translateAgentsConversationText("agents.conversation.header.newSession")}
        onClick={onNewSession}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          "text-[var(--color-text-sub,#8c8c8c)] transition active:scale-95",
        )}
      >
        <Plus size={20} />
      </button>
    </header>
  );
}
