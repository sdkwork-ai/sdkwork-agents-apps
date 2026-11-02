import { useState } from "react";

import { cn } from "@sdkwork/agents-h5-commons";

import { ConversationComposer } from "../components/ConversationComposer";
import { ConversationEmptyState } from "../components/ConversationEmptyState";
import { ConversationMessageList } from "../components/ConversationMessageList";
import { ConversationSessionSheet } from "../components/ConversationSessionSheet";
import { ConversationTopBar } from "../components/ConversationTopBar";
import { useConversationController } from "../hooks/useConversationController";
import { useVisualViewportHeight } from "../hooks/useVisualViewportHeight";
import { translateAgentsConversationText } from "../i18n";
import type { ConversationVoicePort } from "../services/conversationVoicePort";
import type { ConversationScope, ConversationSession } from "../types";

export interface ConversationScreenProps {
  /** Agent scope; defaults to the built-in conversational assistant. */
  scope?: ConversationScope;
  /** Explicit runtime model id; resolved through the port when omitted. */
  model?: string;
  /** Greeting shown in the empty state instead of the default hint. */
  welcomeMessage?: string;
  /** Session to open first; defaults to the most recent one. */
  initialSessionId?: string;
  /** Optional voice input port. */
  voice?: ConversationVoicePort | null;
  /** Notified after the session list changes. */
  onSessionsChanged?: (sessions: ConversationSession[]) => void;
  className?: string;
}

/**
 * The mobile conversation surface behind the `tasks` tab.
 *
 * Owns no persistence: every session and turn goes through the injected
 * conversation port, so the H5, mini program, and Flutter roots can render the
 * same composition flow against their own runtime.
 */
export function ConversationScreen({
  scope,
  model,
  welcomeMessage,
  initialSessionId,
  voice = null,
  onSessionsChanged,
  className,
}: ConversationScreenProps) {
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const viewportHeight = useVisualViewportHeight();

  const controller = useConversationController({
    ...(scope ? { scope } : {}),
    ...(model ? { model } : {}),
    ...(initialSessionId ? { initialSessionId } : {}),
    ...(onSessionsChanged ? { onSessionsChanged } : {}),
  });

  const activeSession = controller.sessions.find(
    (session) => session.id === controller.activeSessionId,
  );

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden",
        "bg-[var(--color-bg-color,#F4F7FC)]",
        className,
      )}
      style={viewportHeight ? { height: `${viewportHeight}px` } : undefined}
    >
      <ConversationTopBar
        {...(activeSession ? { sessionTitle: activeSession.title } : {})}
        onOpenSessions={() => setSessionsOpen(true)}
        onNewSession={() => void controller.newSession()}
      />

      {controller.error ? (
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={controller.dismissError}
            className={cn(
              "w-full rounded-xl px-3 py-2 text-left text-[12px]",
              "bg-[var(--color-danger-bg,#FFF1F0)]",
              "text-[var(--color-danger,#F53F3F)]",
            )}
          >
            {controller.error}
          </button>
        </div>
      ) : null}

      {controller.messages.length === 0 ? (
        <ConversationEmptyState {...(welcomeMessage ? { welcomeMessage } : {})} />
      ) : (
        <ConversationMessageList
          messages={controller.messages}
          sending={controller.sending}
          loading={controller.loadingMessages}
          hasMoreHistory={controller.hasMoreHistory}
          onLoadOlder={() => void controller.loadOlderMessages()}
        />
      )}

      <ConversationComposer
        sending={controller.sending}
        voice={voice}
        onSend={(text) => void controller.send(text)}
        onStop={controller.stop}
        actions={[
          {
            id: "new-session",
            label: translateAgentsConversationText("agents.conversation.actions.newSession"),
            onSelect: () => void controller.newSession(),
          },
          {
            id: "session-history",
            label: translateAgentsConversationText("agents.conversation.actions.history"),
            onSelect: () => setSessionsOpen(true),
          },
        ]}
      />

      <ConversationSessionSheet
        open={sessionsOpen}
        sessions={controller.sessions}
        activeSessionId={controller.activeSessionId}
        loading={controller.loadingSessions}
        onClose={() => setSessionsOpen(false)}
        onSelect={(sessionId) => void controller.selectSession(sessionId)}
        onCreate={() => void controller.newSession()}
        onRename={(sessionId, title) => void controller.renameSession(sessionId, title)}
        onDelete={(sessionId) => void controller.deleteSession(sessionId)}
      />
    </div>
  );
}
