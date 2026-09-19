import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Plus, Square, ArrowUp } from "lucide-react";

import { cn } from "@sdkwork/agents-h5-commons";

import { translateAgentsConversationText } from "../i18n";
import type { ConversationVoicePort } from "../services/conversationVoicePort";

/** Host-supplied entry in the composer actions sheet. */
export interface ConversationComposerAction {
  id: string;
  label: string;
  onSelect: () => void;
}

export interface ConversationComposerProps {
  onSend: (text: string) => void;
  /** Cancels an in-flight assistant turn. */
  onStop?: () => void;
  sending?: boolean;
  /** Optional voice input port; the control is disabled when absent. */
  voice?: ConversationVoicePort | null;
  /** Always-available actions prepended to the actions sheet. */
  actions?: readonly ConversationComposerAction[];
  placeholder?: string;
  className?: string;
}

const MAX_TEXTAREA_HEIGHT_PX = 120;

/**
 * Conversation input bar.
 *
 * Composition mirrors the mobile reference: voice control, text field, and a
 * trailing control that becomes the send button once there is content.
 */
export function ConversationComposer({
  onSend,
  onStop,
  sending = false,
  voice = null,
  actions = [],
  placeholder,
  className,
}: ConversationComposerProps) {
  const [text, setText] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const voiceSupported = voice?.isSupported() === true;

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) {
      return;
    }
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }, [text]);

  const submit = useCallback(() => {
    const value = text.trim();
    if (!value || sending) {
      return;
    }
    onSend(value);
    setText("");
  }, [onSend, sending, text]);

  const handleVoiceStart = useCallback(async () => {
    if (!voice || !voiceSupported) {
      return;
    }
    setVoiceActive(true);
    try {
      await voice.start();
    } catch {
      setVoiceActive(false);
    }
  }, [voice, voiceSupported]);

  const handleVoiceEnd = useCallback(async () => {
    if (!voice || !voiceActive) {
      return;
    }
    setVoiceActive(false);
    try {
      const recognized = await voice.stop();
      if (recognized && recognized.trim()) {
        setText((current) => `${current}${recognized}`.trim());
      }
    } catch {
      // A failed recognition leaves the composer untouched.
    }
  }, [voice, voiceActive]);

  const menuActions: readonly ConversationComposerAction[] = actions;

  return (
    <div
      className={cn(
        "px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2",
        "bg-[var(--color-bg-color,#f5f5f7)]",
        className,
      )}
    >
      {actionsOpen ? (
        <div
          className={cn(
            "mb-2 overflow-hidden rounded-2xl",
            "bg-[var(--color-surface-color,#ffffff)]",
            "shadow-[0_4px_16px_rgba(0,0,0,0.08)]",
          )}
        >
          {menuActions.length === 0 ? null : (
            <ul className="divide-y divide-[var(--color-border-color,rgba(0,0,0,0.05))]">
              {menuActions.map((action) => (
                <li key={action.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActionsOpen(false);
                      action.onSelect();
                    }}
                    className="w-full px-4 py-3 text-left text-[14px] text-[var(--color-text-main,#1f1f1f)] active:bg-[var(--color-hover-bg,rgba(0,0,0,0.03))]"
                  >
                    {action.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div
        className={cn(
          "flex items-end gap-2 rounded-full px-2 py-1.5",
          "bg-[var(--color-surface-color,#ffffff)]",
          "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        )}
      >
        <button
          type="button"
          aria-label={translateAgentsConversationText("agents.conversation.composer.voice")}
          title={
            voiceSupported
              ? translateAgentsConversationText("agents.conversation.composer.voice")
              : translateAgentsConversationText(
                  "agents.conversation.composer.voiceUnavailable",
                )
          }
          disabled={!voiceSupported}
          onPointerDown={() => void handleVoiceStart()}
          onPointerUp={() => void handleVoiceEnd()}
          onPointerLeave={() => void handleVoiceEnd()}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition",
            voiceActive
              ? "bg-[var(--color-primary-blue,#2b5ce7)] text-white"
              : "text-[var(--color-text-sub,#8c8c8c)] active:scale-95",
            !voiceSupported && "opacity-40",
          )}
        >
          <AudioLines size={19} aria-hidden="true" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          placeholder={
            placeholder ?? translateAgentsConversationText("agents.conversation.composer.placeholder")
          }
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
          className={cn(
            "min-h-9 flex-1 resize-none bg-transparent py-2 text-[15px] leading-5",
            "text-[var(--color-text-main,#1f1f1f)] outline-none",
            "placeholder:text-[var(--color-text-sub,#9ca3af)]",
          )}
        />

        {text.trim().length > 0 || sending ? (
          <button
            type="button"
            aria-label={
              sending
                ? translateAgentsConversationText("agents.conversation.composer.stop")
                : translateAgentsConversationText("agents.conversation.composer.send")
            }
            onClick={sending ? onStop : submit}
            disabled={!sending && text.trim().length === 0}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95",
              "bg-[var(--color-primary-blue,#2b5ce7)] text-white",
              "disabled:opacity-40",
            )}
          >
            {sending ? <Square size={15} aria-hidden="true" /> : <ArrowUp size={18} aria-hidden="true" />}
          </button>
        ) : (
          <button
            type="button"
            aria-label={translateAgentsConversationText("agents.conversation.composer.more")}
            onClick={() => setActionsOpen((open) => !open)}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95",
              "text-[var(--color-text-main,#1f1f1f)]",
            )}
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
