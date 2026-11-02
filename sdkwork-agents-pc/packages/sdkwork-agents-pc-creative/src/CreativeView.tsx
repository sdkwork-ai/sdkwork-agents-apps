import React, { useState, useEffect, useRef } from 'react';
import { CreativeInputBox, consumeCreativeHandoff, creativeModelCatalogService } from '@sdkwork/agents-pc-commons';
import { resolveCreativeCreationType } from '@sdkwork/agents-pc-core/sdk/creationTypes';
import { ImageDetailModal } from '@sdkwork/agents-pc-inspiration';
import { VideoDetailModal } from '@sdkwork/agents-pc-inspiration';
import { useTranslation } from 'react-i18next';
import { SidebarOpen, Sparkles } from 'lucide-react';
import { cn } from '@sdkwork/agents-pc-commons';

import { CreativeSession, CreativeMessage } from './types';
import { CreativeSidebar } from './components/CreativeSidebar';
import { CreativeEmptyState } from './components/CreativeEmptyState';
import { CreativeToolbar } from './components/CreativeToolbar';
import { CreativeMessageItem } from './components/CreativeMessageItem';
import { PromptHistoryItem } from './components/CreativeHistoryLog';

import { CreativeService, CreativeSessionStore } from './services/CreativeService';
import { uuid } from '@sdkwork/utils';

function createDefaultCreativeSession(): CreativeSession {
  return { id: 'default', title: '默认创作', messages: [] };
}

/** Shape of the media resources the creative input box uploads through Drive. */
interface CreativeMediaResourceLike {
  id?: string;
  uri?: string;
  url?: string;
  kind?: string;
  mimeType?: string;
  fileName?: string;
}

function compactCreativeRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => (
      value !== undefined
      && value !== null
      && value !== ''
      && (!(Array.isArray(value)) || value.length > 0)
      && (!(typeof value === 'object' && !Array.isArray(value)) || Object.keys(value).length > 0)
    )),
  );
}

function toCreativeReference(resource: CreativeMediaResourceLike): Record<string, string> {
  return compactCreativeRecord({
    // Vendors fetch the presigned download URL; the Drive node id rides along
    // for server-side asset resolution.
    url: resource.url || resource.uri,
    assetId: resource.id,
    mimeType: resource.mimeType,
    name: resource.fileName,
  }) as Record<string, string>;
}

/**
 * Translate the creative input-box settings into generations command
 * parameters. Aspect ratio / resolution / duration / count reach the vendor
 * adapters through `parameters.generationConfig`; uploaded reference media
 * reaches them through `parameters.referenceImages` / `referenceVideos`.
 */
function buildCreativeCommandOptions(
  _prompt: string,
  _mode: string,
  settings?: Record<string, unknown>,
): { commandParameters?: Record<string, unknown>; commandInputAssetIds?: string[] } {
  const mediaResources = (Array.isArray(settings?.mediaResources)
    ? settings?.mediaResources
    : []) as CreativeMediaResourceLike[];
  if (mediaResources.length === 0 && !settings) {
    return {};
  }
  const imageResources = mediaResources.filter((resource) => (
    (resource.kind ?? 'image') === 'image' && Boolean(resource.url || resource.uri)
  ));
  const videoResources = mediaResources.filter((resource) => (
    resource.kind === 'video' && Boolean(resource.url || resource.uri)
  ));
  const audioResource = mediaResources.find((resource) => (
    (resource.kind === 'audio' || resource.kind === 'voice') && Boolean(resource.url || resource.uri)
  ));
  const generationConfig = compactCreativeRecord({
    aspectRatio: settings?.ratio,
    resolution: settings?.resolution,
    durationSeconds: settings?.duration,
    imageCount: settings?.count,
    videoMode: settings?.videoMode,
    size: settings?.imageWidth && settings?.imageHeight
      ? `${settings.imageWidth}x${settings.imageHeight}`
      : undefined,
  });
  const commandParameters = compactCreativeRecord({
    generationConfig,
    referenceImages: imageResources.map(toCreativeReference),
    referenceVideos: videoResources.map(toCreativeReference),
    audioUrl: audioResource?.url || audioResource?.uri,
  });
  const commandInputAssetIds = imageResources
    .map((resource) => resource.id)
    .filter((id): id is string => Boolean(id?.trim()));
  return {
    ...(Object.keys(commandParameters).length > 0 ? { commandParameters } : {}),
    ...(commandInputAssetIds.length > 0 ? { commandInputAssetIds } : {}),
  };
}

export interface CreativeViewProps {
  /** Default modality selected in the generation dialog (`image`, `video`, `agent`, …). */
  defaultCreationMode?: string;
}

export const CreativeView = ({ defaultCreationMode = 'agent' }: CreativeViewProps) => {
  const { t } = useTranslation('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [sessions, setSessions] = useState<CreativeSession[]>(() => [createDefaultCreativeSession()]);
  const [activeSessionId, setActiveSessionId] = useState('default');

  const [historyLogs, setHistoryLogs] = useState<PromptHistoryItem[]>(() => {
    const saved = localStorage.getItem('creative_prompt_history_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
      }
    return [
      {
        id: 'demo-1',
        prompt: '一只穿戴宇航服、手持激光剑的未来派赛博朋克风猫咪，深邃星空背景，色彩鲜艳，写实风格，8k 极致细节',
        mode: 'image',
        timestamp: Date.now() - 3600000 * 2,
        settings: {
          model: 'Flux 1.0 Ultra',
          ratio: '16:9',
          style: 'Cyberpunk'
        }
      },
      {
        id: 'demo-2',
        prompt: '生成一首轻快欢跃、具有动感夏日海滩风情的电子尤克里里纯音乐',
        mode: 'music',
        timestamp: Date.now() - 3600000 * 24,
        settings: {
          model: 'Suno Music 3.5',
          duration: 30
        }
        }
    ];
  });

  const [inputKey, setInputKey] = useState(0);
  const [currentDefaultValue, setCurrentDefaultValue] = useState('');
  const [currentInitialMode, setCurrentInitialMode] = useState(defaultCreationMode);
  const [currentInitialSettings, setCurrentInitialSettings] = useState<any>(undefined);

  const onLoadConfig = (item: PromptHistoryItem) => {
    setCurrentDefaultValue(item.prompt);
    setCurrentInitialMode(item.mode);
    setCurrentInitialSettings(item.settings);
    setInputKey(prev => prev + 1);
    showToast("已成功载入该历史 Prompts 及配置参数！");
  };

  const onReRun = (item: PromptHistoryItem) => {
    showToast("正在重新运行选定的历史配置...");
    handleSend(item.prompt, item.mode, item.settings);
  };

  const onDeleteLog = (id: string) => {
    setHistoryLogs(prev => {
      const updated = prev.filter(x => x.id !== id);
      localStorage.setItem('creative_prompt_history_logs', JSON.stringify(updated));
      return updated;
    });
    showToast("已删除该条历史记录");
  };

  const onClearLogs = () => {
    setHistoryLogs([]);
    localStorage.removeItem('creative_prompt_history_logs');
    showToast("历史生成记录已清空");
  };

  useEffect(() => {
    let cancelled = false;
    void CreativeService.getSessions().then((data) => {
      if (cancelled || data.length === 0) return;
      // Merge instead of replace: a generation dispatched while the load was
      // in flight lives only in local state (the backend page predates it),
      // and a replace used to wipe the pending card and the typed prompt.
      setSessions(prev => {
        const byId = new Map(prev.map(s => [s.id, s] as const));
        const merged: CreativeSession[] = data.map(loaded => {
          const existing = byId.get(loaded.id);
          if (!existing) return loaded;
          byId.delete(loaded.id);
          const messages = loaded.messages.length >= existing.messages.length
            ? loaded.messages
            : existing.messages;
          const placeholderTitle = existing.title === '新对话' || existing.title === '默认创作';
          return {
            ...loaded,
            messages,
            title: placeholderTitle ? loaded.title : existing.title,
            isPinned: existing.isPinned || loaded.isPinned,
          };
        });
        // Local-only sessions (created mid-load, no records yet) survive.
        for (const local of byId.values()) merged.push(local);
        return merged;
      });
      // Keep the conversation the user is looking at; only fall back to the
      // newest loaded session when the active one no longer exists.
      const active = data.some(s => s.id === activeSessionId) ? activeSessionId : data[0].id;
      setActiveSessionId(active);
      // The sidebar read defers per-turn media to the session load, so the
      // session the user is actually looking at resolves its media now.
      void CreativeService.loadSession(active).then((session) => {
        if (cancelled || !session) return;
        setSessions(current => current.map(s => s.id === active
          ? (
            session.messages.length >= s.messages.length
              ? { ...session, title: s.title, isPinned: s.isPinned }
              : s
          )
          : s));
      });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Interactive features
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [messageLayouts, setMessageLayouts] = useState<Record<string, 'grid' | 'masonry' | 'carousel'>>({});
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleTogglePin = (id: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        const nextPin = !s.isPinned;
        CreativeSessionStore.setPinned(id, nextPin);
        showToast(nextPin ? "已置顶会话" : "已取消置顶");
        return { ...s, isPinned: nextPin };
      }
      return s;
    }));
  };

  const handleSaveRename = (id: string, customTitle?: string) => {
    const finalTitle = (customTitle || '').trim();
    if (!finalTitle) return;
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, title: finalTitle };
      }
      return s;
    }));
    // Titles are presentation-only; persist them so a reload keeps the name.
    CreativeSessionStore.rename(id, finalTitle);
    showToast("会话重命名成功");
  };

  const handleToggleLayout = (msgId: string) => {
    setMessageLayouts(prev => {
      const current = prev[msgId] || 'grid';
      let next: 'grid' | 'masonry' | 'carousel' = 'grid';
      if (current === 'grid') next = 'masonry';
      else if (current === 'masonry') next = 'carousel';
      else next = 'grid';

      showToast(`已切换布局排版为: ${next === 'grid' ? '经典网格' : next === 'masonry' ? '海报拼图' : '焦点轮播'}`);
      return { ...prev, [msgId]: next };
    });
  };

  const handleDeleteMessage = (msgId: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const index = s.messages.findIndex(m => m.id === msgId);
        if (index === -1) return s;

        let toRemoveIndices = [index];
        if (index > 0 && s.messages[index - 1].role === 'user') {
          toRemoveIndices.push(index - 1);
        }

        // Deletion is presentational; persist the record id so a reload (or
        // the authoritative per-session reload) does not resurrect the turn.
        for (const removed of toRemoveIndices) {
          const removedId = s.messages[removed].id;
          CreativeSessionStore.hideRecord(
            removedId.endsWith('-prompt')
              ? removedId.slice(0, -'-prompt'.length)
              : removedId,
          );
        }

        return {
          ...s,
          messages: s.messages.filter((_, idx) => !toRemoveIndices.includes(idx))
        };
      }
      return s;
    }));
    showToast("已删除该条生成内容");
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages]);

  // Handle incoming prompt from InspirationView
  useEffect(() => {
    const handoff = consumeCreativeHandoff();
    if (handoff) {
      // The staged settings used to be dropped here, so every inspiration-page
      // submission arrived at `handleSend` with `settings === undefined`.
      handleSend(handoff.prompt, handoff.mode, handoff.settings);
    }
  }, [activeSessionId]);

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    // Re-fetch the conversation's own turns: the sidebar list is assembled
    // from the newest global page and truncates conversations that fall
    // outside it. Only replace when the authoritative list carries at least
    // as many turns, so an in-flight generation never gets dropped.
    void CreativeService.loadSession(id).then((session) => {
      if (!session) return;
      setSessions(prev => prev.map(s => s.id === id
        ? (
          session.messages.length >= s.messages.length
            ? { ...session, title: s.title, isPinned: s.isPinned }
            : s
        )
        : s));
    });
  };

  const handleNewChat = () => {
    // A stable uuid doubles as the backend conversation key; timestamp ids
    // collide when two sessions are created within the same millisecond.
    const newId = uuid();
    setSessions(prev => [
      { id: newId, title: '新对话', messages: [] },
      ...prev
    ]);
    setActiveSessionId(newId);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Hide the conversation locally so a reload does not resurrect it; the
    // generation records themselves stay (the generations surface has no
    // delete endpoint by contract).
    CreativeSessionStore.setHidden(id, true);
    if (sessions.length <= 1) {
      const resetSession = createDefaultCreativeSession();
      setSessions([resetSession]);
      setActiveSessionId(resetSession.id);
      return;
    }
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleSend = async (text: string, mode: string = 'agent', settings?: any) => {
    if (!text.trim()) return;

    // Track/Sync in History Log
    const newLogItem: PromptHistoryItem = {
      id: 'log-' + Date.now() + Math.random().toString(36).substr(2, 4),
      prompt: text.trim(),
      mode: mode,
      timestamp: Date.now(),
      settings: settings || {
        model: resolveCreativeCreationType(mode).label,
        ratio: '1:1'
      }
    };
    setHistoryLogs(prev => {
      const filtered = prev.filter(x => x.prompt.trim() !== text.trim());
      const updated = [newLogItem, ...filtered].slice(0, 50);
      localStorage.setItem('creative_prompt_history_logs', JSON.stringify(updated));
      return updated;
    });

    const userMsgId = `user-${uuid()}`;
    const userMessage: CreativeMessage = {
      id: userMsgId,
      role: 'user',
      text: text
    };

    // Add user message to session & update title if default/new
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const title = (s.title === '默认创作' || s.title === '新对话')
          ? (text.length > 12 ? text.slice(0, 12) + '...' : text)
          : s.title;
        return {
          ...s,
          title,
          messages: [...s.messages, userMessage]
        };
      }
      return s;
    }));

    let assistantMessageId: string | null = null;
    try {
      await CreativeService.generateContent(text, mode, (assistantMsg) => {
        assistantMessageId = assistantMsg.id;
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            const exists = s.messages.some(m => m.id === assistantMsg.id);
            return {
              ...s,
              messages: exists
                ? s.messages.map(m => m.id === assistantMsg.id ? assistantMsg : m)
                : [...s.messages, assistantMsg]
            };
          }
          return s;
        }));
      }, mode === 'agent' ? undefined : settings?.model, {
        // Multi-turn continuity: every command of the active session rides the
        // same conversation key, so a reload reassembles the conversation.
        conversationId: activeSessionId,
        // Reference images change the operation (image_edit / image_to_video)
        // rather than only decorating it.
        hasReferenceImages: Array.isArray(settings?.refImages) && settings.refImages.length > 0,
        ...buildCreativeCommandOptions(text, mode, settings),
        // The first upload previews on the pending card while the command runs.
        previewImageUrl: (Array.isArray(settings?.mediaResources) ? settings.mediaResources : [])
          .map((resource: { url?: string; uri?: string }) => resource.url || resource.uri)
          .find((url: string | undefined): url is string => Boolean(url)),
      });
    } catch (error) {
      if (assistantMessageId) {
        setSessions(prev => prev.map(s => s.id === activeSessionId
          ? { ...s, messages: s.messages.filter(message => message.id !== assistantMessageId) }
          : s));
      }
      const message = error instanceof Error ? error.message : '未知错误';
      showToast(`生成失败：${message}`);
    }
  };

  return (
    <div className="flex h-full w-full bg-[var(--ag-color-background,#F4F7FC)] text-[var(--ag-color-text-primary,#0A1B3D)] overflow-hidden font-sans">
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        .scanner-bar {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>

      {/* Sidebar */}
      <CreativeSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        handleNewChat={handleNewChat}
        handleSaveRename={handleSaveRename}
        handleTogglePin={handleTogglePin}
        handleDeleteSession={handleDeleteSession}
        historyLogs={historyLogs}
        onReRun={onReRun}
        onLoadConfig={onLoadConfig}
        onDeleteLog={onDeleteLog}
        onClearLogs={onClearLogs}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-[var(--ag-color-surface,#FFFFFF)]">
        {/* Toggle Sidebar Button */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors z-50 bg-white/80 dark:bg-[#141414] cursor-pointer"
          >
            <SidebarOpen size={18} />
          </button>
        )}

        {!currentSession ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-[var(--ag-color-text-tertiary,#8A97AD)] bg-[var(--ag-color-surface,#FFFFFF)]">
            <div className="w-8 h-8 border-2 border-[#165DFF]/30 border-t-[#4080FF] rounded-full animate-spin mb-4" />
            <p className="text-sm">加载中...</p>
          </div>
        ) : currentSession.messages.length === 0 ? (
          /* Empty Landing View */
          <CreativeEmptyState
            activeSessionId={activeSessionId}
            handleSend={handleSend}
            initialMode={defaultCreationMode}
          />
        ) : (
          /* Message Flow Dialog View */
          <div className="flex-1 flex flex-col overflow-hidden w-full relative">
            {/* Header / Filter Toolbar */}
            <CreativeToolbar title={currentSession.title} />

            {/* Scrollable conversation history */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar bg-[var(--ag-color-background,#F4F7FC)]"
            >
              <div className="max-w-[1056px] mx-auto w-full space-y-8">
                {currentSession.messages.filter(m => m.role === 'assistant').map((m) => (
                  <CreativeMessageItem
                    key={m.id}
                    message={m}
                    layout={messageLayouts[m.id] || 'grid'}
                    carouselIndex={carouselIndices[m.id] || 0}
                    onPreviewImage={(message, idx) => {
                      if (message.mode === 'video') {
                        setSelectedVideo({
                          id: message.id + '-' + idx,
                          title: message.text || 'AI 智能创作视频',
                          author: '我',
                          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
                          likes: 88,
                          duration: '00:05',
                          desc: message.text || '通过 AI 智能生成的创意视频片段。',
                          cover: message.imageUrls?.[idx] || message.imageUrl || '',
                          videoUrl: message.videoUrls?.[idx] || message.videoUrl || ''
                        });
                      } else {
                        setSelectedImage({
                          src: message.imageUrls?.[idx] || '',
                          imageUrls: message.imageUrls || [message.imageUrl || ''],
                          currentIndex: idx,
                          prompt: message.text || '',
                          author: '我',
                          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
                          date: '刚刚',
                          likes: 120,
                          aspectRatio: message.modelInfo?.includes('1:1') ? '1:1' : '16:9',
                          model: message.modelInfo || '图片 5.0 Ultra'
                        });
                      }
                    }}
                    onSetCarouselIndex={(idx) => setCarouselIndices(prev => ({ ...prev, [m.id]: idx }))}
                    onToggleLayout={() => handleToggleLayout(m.id)}
                    onSend={handleSend}
                    onDelete={() => handleDeleteMessage(m.id)}
                  />
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </div>
              </div>

            {/* Bottom floating input box */}
            <div className="p-6 bg-[var(--ag-color-background,#F4F7FC)] w-full">
              <div className="max-w-[1056px] mx-auto relative">
                <CreativeInputBox
                  key={activeSessionId + "-bottom-" + inputKey}
                  defaultValue={currentDefaultValue}
                  initialMode={currentInitialMode}
                  initialSettings={currentInitialSettings}
                  onSubmit={(val, mode, settings) => {
                    handleSend(val, mode, settings);
                    setCurrentDefaultValue('');
                  }}
                  className="w-full"
                />

                {/* Floating footer text */}
                <div className="text-center mt-3 text-[10px] text-zinc-400 font-medium dark:text-[var(--ag-color-text-tertiary,#8A97AD)]">
                  创作内容由 AI 生成，请注意甄别其真实性与合规性
                </div>
                </div>
                </div>
                </div>
        )}
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#E8F0FF] text-[#0E42D2] px-4 py-2 rounded-lg text-xs font-medium z-[100] flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300 dark:bg-[#0A1B3D] dark:text-[#4080FF]">
          <Sparkles size={14} className="text-[#165DFF] dark:text-[#4080FF]" />
          {toastMessage}
        </div>
      )}

      {/* Reusable Image/Video Detail Modal for High-Res View */}
      <ImageDetailModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        image={selectedImage}
      />

      <VideoDetailModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        video={selectedVideo}
      />
    </div>
  );
};
