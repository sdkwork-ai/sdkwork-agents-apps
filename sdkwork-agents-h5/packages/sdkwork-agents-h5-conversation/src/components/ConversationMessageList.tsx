import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, Bot, Wrench } from "lucide-react";

import { cn } from "@sdkwork/agents-h5-commons";

import { translateAgentsConversationText } from "../i18n";
import type { ConversationMessage, ConversationToolCall } from "../types";

export interface ConversationMessageListProps {
  messages: ConversationMessage[];
  /** True while an assistant turn is streaming. */
  sending?: boolean;
  loading?: boolean;
  hasMoreHistory?: boolean;
  onLoadOlder?: () => void;
  className?: string;
}

function toolStatusLabel(call: ConversationToolCall): string {
  if (call.status === "error") {
    return translateAgentsConversationText("agents.conversation.tool.failed");
  }
  if (call.status === "completed") {
    return translateAgentsConversationText("agents.conversation.tool.completed");
  }
  return translateAgentsConversationText("agents.conversation.tool.running");
}

function ToolCallCard({ call }: { call: ConversationToolCall }) {
  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-[12px]",
        "bg-[var(--color-surface-color,#ffffff)]",
        "border border-[var(--color-border-color,rgba(0,0,0,0.06))]",
      )}
    >
      <Wrench size={13} aria-hidden="true" className="shrink-0 text-[var(--color-text-sub,#8c8c8c)]" />
      <span className="min-w-0 flex-1 truncate font-medium text-[var(--color-text-main,#1f1f1f)]">
        {call.name ?? call.id}
      </span>
      <span
        className={cn(
          "shrink-0",
          call.status === "error"
            ? "text-[var(--color-danger,#dc2626)]"
            : "text-[var(--color-text-sub,#8c8c8c)]",
        )}
      >
        {toolStatusLabel(call)}
      </span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={translateAgentsConversationText("agents.conversation.message.copy")}
      className={cn(
        "mt-1 flex items-center gap-1 self-start text-[11px] transition",
        "text-[var(--color-text-sub,#8c8c8c)] active:scale-95",
      )}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span>
        {copied
          ? translateAgentsConversationText("agents.conversation.message.copied")
          : translateAgentsConversationText("agents.conversation.message.copy")}
      </span>
    </button>
  );
}

function AssistantMessage({ message }: { message: ConversationMessage }) {
  return (
    <div className="flex max-w-[88%] items-start gap-2">
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          "bg-[var(--color-surface-color,#ffffff)]",
        )}
      >
        <Bot size={15} aria-hidden="true" className="text-[var(--color-primary-blue,#2b5ce7)]" />
      </div>
      <div className="flex min-w-0 flex-col">
        <div
          className={cn(
            "rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[15px] leading-6",
            "bg-[var(--color-surface-color,#ffffff)] text-[var(--color-text-main,#1f1f1f)]",
            "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          )}
        >
          {message.reasoning?.trim() ? (
            <details className="mb-2 text-[12px] text-[var(--color-text-sub,#8c8c8c)]">
              <summary className="cursor-pointer select-none">
                {translateAgentsConversationText("agents.conversation.reasoning.title")}
              </summary>
              <p className="mt-1 whitespace-pre-wrap">{message.reasoning}</p>
            </details>
          ) : null}
          {message.text.trim() ? (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          ) : message.streaming ? (
            <span className="inline-flex items-center gap-2 text-[var(--color-text-sub,#8c8c8c)]">
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              {translateAgentsConversationText("agents.conversation.status.sending")}
            </span>
          ) : null}
          {(message.toolCalls ?? []).map((call) => (
            <ToolCallCard key={call.id} call={call} />
          ))}
          {message.error ? (
            <p className="mt-2 text-[12px] text-[var(--color-danger,#dc2626)]">{message.error}</p>
          ) : null}
        </div>
        {message.text.trim() && !message.streaming ? <CopyButton text={message.text} /> : null}
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: ConversationMessage }) {
  return (
    <div className="flex max-w-[88%] flex-col items-end self-end">
      <div
        className={cn(
          "rounded-2xl rounded-tr-md px-3.5 py-2.5 text-[15px] leading-6 text-white",
          "bg-[var(--color-primary-blue,#2b5ce7)]",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
      </div>
    </div>
  );
}

/** Scrollable transcript. */
export function ConversationMessageList({
  messages,
  sending = false,
  loading = false,
  hasMoreHistory = false,
  onLoadOlder,
  className,
}: ConversationMessageListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastCountRef = useRef(0);

  // Keep the newest turn in view while the assistant streams.
  useEffect(() => {
    if (messages.length === lastCountRef.current) {
      if (sending) {
        bottomRef.current?.scrollIntoView({ block: "end" });
      }
      return;
    }
    lastCountRef.current = messages.length;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending]);

  const handleScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node || !hasMoreHistory || loading || !onLoadOlder) {
      return;
    }
    if (node.scrollTop <= 48) {
      onLoadOlder();
    }
  }, [hasMoreHistory, loading, onLoadOlder]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn(
        "custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3",
        className,
      )}
    >
      {hasMoreHistory && onLoadOlder ? (
        <button
          type="button"
          onClick={onLoadOlder}
          disabled={loading}
          className={cn(
            "self-center rounded-full px-3 py-1 text-[12px] transition",
            "text-[var(--color-text-sub,#8c8c8c)] disabled:opacity-50",
          )}
        >
          {translateAgentsConversationText("agents.conversation.status.loading")}
        </button>
      ) : null}
      {messages.map((message) =>
        message.role === "user" ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AssistantMessage key={message.id} message={message} />
        ),
      )}
      <div ref={bottomRef} />
    </div>
  );
}
