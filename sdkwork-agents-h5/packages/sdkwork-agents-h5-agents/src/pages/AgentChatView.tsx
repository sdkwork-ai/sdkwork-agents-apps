import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Bot, Copy, Check, Paperclip } from "lucide-react";

import { Avatar } from "@sdkwork/agents-h5-commons";

import { MessageInput } from "../components/MessageInput";
import { toast } from "../components/Toast";
import { agentService } from "../services/AgentService";
import { agentChatService, type ChatMessage } from "../services/AgentChatService";
import { createDefaultAvatar } from "../services/DefaultAvatarService";
import {
  agentsH5DriveUploadService,
  type AgentsH5DriveMediaResource,
} from "@sdkwork/agents-h5-core/sdk/driveUploadService";

type ComposerAttachmentKind = "file" | "image" | "video" | "voice";

function resolveUploadPurpose(kind: ComposerAttachmentKind): "agent-chat-attachment" | "agent-chat-image" | "agent-chat-video" | "agent-chat-voice" {
  switch (kind) {
    case "image":
      return "agent-chat-image";
    case "video":
      return "agent-chat-video";
    case "voice":
      return "agent-chat-voice";
    default:
      return "agent-chat-attachment";
  }
}

/** Hydrates short-lived delivery URLs for Drive-backed media so bubbles render. */
function useDriveMediaUrlHydration(
  messages: ChatMessage[],
  patchMessage: (messageId: string, updater: (message: ChatMessage) => ChatMessage) => void,
) {
  useEffect(() => {
    const pending: Array<{ messageId: string; resource: AgentsH5DriveMediaResource }> = [];
    for (const message of messages) {
      for (const resource of message.mediaResources ?? []) {
        if (!resource.url && resource.uri.startsWith("drive://")) {
          pending.push({ messageId: message.id, resource });
        }
      }
    }
    if (pending.length === 0) {
      return;
    }
    let cancelled = false;
    // Bounded per pass: history pages add at most one page of media at a time.
    for (const entry of pending.slice(0, 20)) {
      agentsH5DriveUploadService.resolvePreviewUrl(entry.resource.uri)
        .then((url) => {
          if (cancelled) return;
          patchMessage(entry.messageId, (message) => ({
            ...message,
            mediaResources: (message.mediaResources ?? []).map((resource) =>
              resource.id === entry.resource.id && !resource.url ? { ...resource, url } : resource),
          }));
        })
        .catch(() => {
          // A Drive node the caller cannot read stays unrendered; the drive
          // URI in the transcript remains the durable identity.
        });
    }
    return () => {
      cancelled = true;
    };
  }, [messages, patchMessage]);
}

export interface AgentChatViewProps {
  agentId: string;
  agentName?: string;
  welcomeMessage?: string;
  onBack: () => void;
}

/**
 * Track the mobile visual viewport height so the composer stays pinned above
 * the on-screen keyboard. iOS Safari never resizes the layout viewport when
 * the keyboard opens (`100dvh` stays behind the keyboard); the visual
 * viewport is the only reliable height source. Falls back to the layout
 * viewport height when `visualViewport` is unavailable.
 */
function useVisualViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const visualViewport = typeof window === "undefined" ? null : window.visualViewport;
    if (!visualViewport) {
      return undefined;
    }
    const update = () => setHeight(visualViewport.height);
    update();
    visualViewport.addEventListener("resize", update);
    visualViewport.addEventListener("scroll", update);
    return () => {
      visualViewport.removeEventListener("resize", update);
      visualViewport.removeEventListener("scroll", update);
    };
  }, []);
  return height;
}

/** Maximum in-memory chat bubbles for one interactive session view. */
const MAX_CHAT_MESSAGES = 200;

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_CHAT_MESSAGES) {
    return messages;
  }
  return messages.slice(messages.length - MAX_CHAT_MESSAGES);
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Renders text plus any Drive-backed media carried by the message bubble. */
function ChatMessageBody({ message }: { message: ChatMessage }) {
  const media = message.mediaResources ?? [];
  return (
    <div className="flex flex-col gap-2">
      {message.content ? <p className="whitespace-pre-wrap">{message.content}</p> : null}
      {media.map((resource) => {
        if (resource.kind === "image" && resource.url) {
          return (
            <img
              key={resource.id}
              src={resource.url}
              alt={resource.fileName ?? "图片附件"}
              className="max-h-64 w-auto max-w-full rounded-xl"
              loading="lazy"
            />
          );
        }
        if (resource.kind === "video" && resource.url) {
          return (
            <video key={resource.id} src={resource.url} controls className="max-h-64 w-auto max-w-full rounded-xl" />
          );
        }
        if (resource.kind === "voice" || resource.kind === "audio") {
          return resource.url ? (
            <audio key={resource.id} src={resource.url} controls className="w-full" />
          ) : (
            <div key={resource.id} className="text-xs opacity-70">语音消息</div>
          );
        }
        return (
          <div key={resource.id} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs">
            <Paperclip size={12} className="shrink-0" />
            <span className="truncate">{resource.fileName ?? resource.uri}</span>
          </div>
        );
      })}
    </div>
  );
}

export const AgentChatView: React.FC<AgentChatViewProps> = ({
  agentId,
  agentName: initialAgentName,
  welcomeMessage: initialWelcomeMessage,
  onBack,
}) => {
  const visualViewportHeight = useVisualViewportHeight();
  const [agentName, setAgentName] = useState(initialAgentName ?? "智能体");
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialWelcomeMessage ?? "你好，我是你的智能助手，有什么可以帮你的？",
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [oldestLoadedCursor, setOldestLoadedCursor] = useState<string | null>(null);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setBootstrapping(true);
      try {
        let sessionTitle = initialAgentName ?? "Chat";
        if (!initialAgentName || !initialWelcomeMessage) {
          const agent = await agentService.getAgent(agentId);
          if (agent && !cancelled) {
            sessionTitle = agent.name;
            setAgentName(agent.name);
            if (agent.welcomeMessage) {
              setWelcomeMessage(agent.welcomeMessage);
            }
          }
        }

        const resolvedSessionId = await agentChatService.resolveOrCreateSession(agentId, sessionTitle);
        if (cancelled) {
          return;
        }
        setSessionId(resolvedSessionId);

        const historyPage = await agentChatService.loadRecentMessages(agentId, resolvedSessionId);
        if (!cancelled) {
          setMessages(trimMessages(historyPage.items));
          setOldestLoadedCursor(historyPage.pageInfo.nextCursor ?? null);
          setHasOlderMessages(historyPage.pageInfo.hasMore);
        }
      } catch {
        if (!cancelled) {
          toast("无法启动聊天会话，请检查登录与后端连接", "error");
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [agentId, initialAgentName, initialWelcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const patchMessage = React.useCallback(
    (messageId: string, updater: (message: ChatMessage) => ChatMessage) => {
      setMessages((prev) => prev.map((message) => (message.id === messageId ? updater(message) : message)));
    },
    [],
  );
  useDriveMediaUrlHydration(messages, patchMessage);

  const loadOlderMessages = async () => {
    if (!sessionId || loadingOlder || !hasOlderMessages || oldestLoadedCursor === null) {
      return;
    }

    const container = scrollContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;
    const nextCursor = oldestLoadedCursor;

    setLoadingOlder(true);
    try {
      const olderPage = await agentChatService.listMessagesPage(agentId, sessionId, nextCursor);
      setMessages((prev) => trimMessages([...olderPage.items, ...prev]));
      setOldestLoadedCursor(olderPage.pageInfo.nextCursor ?? null);
      setHasOlderMessages(olderPage.pageInfo.hasMore);
      requestAnimationFrame(() => {
        if (!container) {
          return;
        }
        container.scrollTop = container.scrollHeight - previousScrollHeight + previousScrollTop;
      });
    } catch {
      toast("无法加载更早的消息", "error");
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (event.currentTarget.scrollTop <= 48) {
      void loadOlderMessages();
    }
  };

  const handleSend = async (
    content: string,
    type?: "text" | "image" | "file" | "voice" | "video",
    extraInfo?: { file?: File; fileName?: string; mimeType?: string },
  ) => {
    if (isTyping || !sessionId) {
      return;
    }
    const attachment = extraInfo?.file;
    if (!attachment && !content.trim()) {
      return;
    }

    let media: AgentsH5DriveMediaResource | undefined;
    if (attachment) {
      // Real uploads go through the Drive uploader (`DRIVE_SPEC.md` section 9);
      // the local preview URL from the composer never reaches the transcript.
      try {
        media = await agentsH5DriveUploadService.upload({
          file: attachment,
          purpose: resolveUploadPurpose((type ?? "file") as ComposerAttachmentKind),
          resourceId: `agents-chat:${sessionId}`,
        });
      } catch (uploadError) {
        const detail = uploadError instanceof Error && uploadError.message.trim()
          ? uploadError.message
          : "附件上传失败，请重试";
        toast(detail, "error");
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: media ? "" : content.trim(),
      mediaResources: media ? [media] : undefined,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => trimMessages([...prev, userMessage]));
    setIsTyping(true);

    try {
      const assistant = await agentChatService.sendMessage(
        agentId,
        sessionId,
        media ? "" : content.trim(),
        undefined,
        undefined,
        undefined,
        media,
      );
      setMessages((prev) => trimMessages([...prev, assistant]));
    } catch (sendError) {
      setMessages((prev) => prev.filter((message) => message.id !== userMessage.id));
      const detail = sendError instanceof Error && sendError.message.trim()
        ? sendError.message
        : '';
      toast(detail || "发送失败：后端未返回有效回复", "error");
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    void navigator.clipboard.writeText(content);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const visibleMessages =
    messages.length > 0
      ? messages
      : [
          {
            id: "welcome",
            role: "assistant" as const,
            content: welcomeMessage,
            createdAt: new Date().toISOString(),
          },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      // Own height (visual viewport tracked when the on-screen keyboard opens,
      // `h-full` fallback for hosts that bound the page) so the message list
      // flexes in the middle and the composer stays pinned to the bottom.
      // Colors follow the host chat theme (`--color-*` tokens with the
      // standalone dark palette as fallback).
      className="flex h-full flex-col overflow-hidden bg-[var(--color-bg-color,#1e1e1e)] text-[var(--color-text-main,#e5e7eb)]"
      style={visualViewportHeight !== null ? { height: visualViewportHeight } : undefined}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border-color,rgba(255,255,255,0.1))] bg-[var(--color-glass-bg,#202020)] px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-2 text-[var(--color-text-sub,#9ca3af)] transition-colors hover:bg-[var(--color-hover-bg,rgba(255,255,255,0.05))] hover:text-[var(--color-text-main,#ffffff)]"
          >
            <ChevronLeft size={18} />
          </button>
          <Avatar src={createDefaultAvatar("agent")} size="md" fallback="A" />
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-main,#ffffff)]">{agentName}</h2>
            <p className="text-xs text-[var(--color-text-sub,#6b7280)]">生产会话 · sessions API</p>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {bootstrapping ? (
          <div className="py-8 text-center text-sm text-[var(--color-text-sub,#9ca3af)]">正在创建会话...</div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {hasOlderMessages ? (
              <div className="py-2 text-center text-xs text-[var(--color-text-sub,#9ca3af)]">
                {loadingOlder ? "正在加载更早的消息..." : "向上滚动加载更早的消息"}
              </div>
            ) : null}
            {visibleMessages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? "bg-[var(--color-chat-me-bg,#7c3aed)] text-white"
                        : "border border-[var(--color-border-color,rgba(255,255,255,0.1))] bg-[var(--color-chat-other-bg,#262626)] text-[var(--color-text-main,#f3f4f6)]"
                    }`}
                  >
                    <ChatMessageBody message={message} />
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[var(--color-text-sub,#9ca3af)]">
                      <span>{formatTime(message.createdAt)}</span>
                      {!isUser ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(message.id, message.content)}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          {copiedId === message.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping ? (
              <div className="text-sm text-[var(--color-text-sub,#9ca3af)]">智能体正在回复...</div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer pinned to the bottom; safe-area aware for gesture bars. */}
      <div className="shrink-0 border-t border-[var(--color-border-color,rgba(255,255,255,0.1))] bg-[var(--color-glass-bg,#202020)] px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <MessageInput
          onSend={handleSend}
          placeholder="输入消息，使用生产 sessions/messages API..."
          disabled={bootstrapping || !sessionId}
          isTyping={isTyping}
          resizable={false}
          maxHeightPx={
            visualViewportHeight !== null
              ? Math.round(visualViewportHeight * 0.5)
              : undefined
          }
        />
      </div>
    </motion.div>
  );
};
