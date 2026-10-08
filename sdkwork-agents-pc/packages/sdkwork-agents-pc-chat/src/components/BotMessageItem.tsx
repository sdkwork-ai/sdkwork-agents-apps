import React from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Image as ImageIcon,
  Loader2,
  Music,
  ThumbsDown,
  ThumbsUp,
  Video,
  Volume2,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChatMessage, ChatToolCall } from '@sdkwork/agents-pc-chat';
import { MarkdownRenderer, cn } from '@sdkwork/agents-pc-commons';
import { TypingIndicator } from './TypingIndicator';
import { ChatFailureCard } from './ChatFailureCard';

interface BotMessageItemProps {
  message: ChatMessage;
  copiedId: string | null;
  feedback: Record<string, 'up' | 'down'>;
  handleCopy: (text: string, id: string) => void;
  handleFeedback: (id: string, type: 'up' | 'down') => void;
  onOpenArtifact: (lang: string, code: string, mode?: 'preview' | 'code') => void;
  isStreaming?: boolean;
}

/**
 * Collapsible "thinking"/"reasoning" block streamed from the runtime.
 *
 * Interaction contract (industry-standard reasoning UX, mirroring
 * DeepSeek/Kimi-style thinking panes):
 * - While reasoning deltas stream in (`active`), the block auto-expands and
 *   its capped-height body sticks to the bottom edge so the newest thinking
 *   text stays visible while it streams.
 * - When the reasoning phase ends (the first answer delta arrives, or the
 *   stream finishes), the block auto-collapses so the visible answer can
 *   stream below it without pushing the reasoning transcript into view.
 * - A manual toggle always wins while the phase is active (the automatic
 *   behavior only fires on phase transitions); it re-arms on the next
 *   reasoning phase.
 * - Reloaded transcripts render collapsed (streaming is not active).
 */
const ThinkingBlock: React.FC<{ content: string; streaming: boolean; active: boolean }> = ({
  content,
  streaming,
  active,
}) => {
  const { t: tCommon } = useTranslation('common');
  const [open, setOpen] = React.useState(false);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const wasActiveRef = React.useRef(false);

  React.useEffect(() => {
    if (active) {
      if (!wasActiveRef.current) {
        // New reasoning phase: expand immediately so the streamed thinking
        // text is visible while it arrives.
        wasActiveRef.current = true;
        setOpen(true);
      }
    } else if (wasActiveRef.current) {
      // Reasoning phase ended: collapse so the answer streams into view.
      wasActiveRef.current = false;
      setOpen(false);
    }
  }, [active]);

  // Keep the streaming reasoning body pinned to its bottom edge.
  React.useEffect(() => {
    if (active && open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [content, active, open]);

  if (!content) return null;
  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-gray-200/80 bg-gray-50/80 dark:border-gray-700/80 dark:bg-[#232323]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-expanded={open}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {active && <Loader2 size={12} className="animate-spin" />}
        <span>
          {active
            ? tCommon('thinkingRunning', { defaultValue: '深度思考中…' })
            : tCommon('thinking', { defaultValue: '深度思考' })}
        </span>
      </button>
      {open && (
        <div
          ref={bodyRef}
          className="max-h-64 overflow-y-auto border-t border-gray-200/80 px-2.5 py-2"
        >
          <MarkdownRenderer content={content} streaming={active || streaming} muted />
        </div>
      )}
    </div>
  );
};

/** Progress label key + fallback for one media tool (null = not a media tool). */
function mediaProgress(tool: ChatToolCall): { key: string; fallback: string } | null {
  const name = (tool.name ?? '').toLowerCase();
  if (name.includes('image')) {
    return { key: 'toolProgress.image', fallback: '图片生成中…' };
  }
  if (name.includes('video')) {
    return { key: 'toolProgress.video', fallback: '视频生成中…' };
  }
  if (/(audio|speech|voice|music|sound)/.test(name)) {
    return { key: 'toolProgress.audio', fallback: '音频合成中…' };
  }
  return null;
}

function mediaDoneLabel(kind: 'image' | 'video' | 'audio'): { key: string; fallback: string } {
  switch (kind) {
    case 'image':
      return { key: 'toolDone.image', fallback: '图片已生成' };
    case 'video':
      return { key: 'toolDone.video', fallback: '视频已生成' };
    case 'audio':
      return { key: 'toolDone.audio', fallback: '音频已生成' };
  }
}

/** Stable list key for one generated media asset. */
function mediaKey(media: { kind: string; url: string }, index: number): string {
  return media.url ? `${media.kind}:${media.url}` : `${media.kind}:index-${index}`;
}

/** Media family of a generation tool: drives placeholders and result icons. */
type ToolMediaKind = 'image' | 'video' | 'audio';

/** Resolved display identity of one tool invocation. */
interface ToolDisplay {
  /** i18n key for the localized action title, null when unrecognized. */
  titleKey: string | null;
  /** Human fallback title when the key is missing. */
  fallback: string;
  /** Media family for placeholders, null for non-media tools. */
  mediaKind: ToolMediaKind | null;
  /** True when the tool starts a generation (vs. polling an existing one). */
  isCreate: boolean;
}

/** Resolves a raw tool id (`mcp__generations__video.create`, `sound-effect.generate`) into a localized display identity. */
function resolveToolDisplay(name: string | undefined): ToolDisplay {
  const raw = (name ?? '').toLowerCase();
  const compact = raw.replace(/^mcp__generations__/, '');
  const isRetrieve = compact.endsWith('retrieve');
  const kind: ToolMediaKind | 'sfx' | 'transcriptions' | 'translations' | null = compact.includes(
    'image',
  )
    ? 'image'
    : compact.includes('video')
      ? 'video'
      : compact.includes('music') || compact.includes('speech') || compact.includes('sound-effect') || compact.includes('sound_effect')
        ? 'audio'
        : compact.includes('transcription')
          ? 'transcriptions'
          : compact.includes('translation')
            ? 'translations'
            : null;
  const action = isRetrieve ? 'retrieve' : 'create';
  const titleKeys: Record<string, string> = {
    'image.create': 'toolTitle.image.create',
    'image.retrieve': 'toolTitle.image.retrieve',
    'video.create': 'toolTitle.video.create',
    'video.retrieve': 'toolTitle.video.retrieve',
    'audio.create': 'toolTitle.speech.create',
    'sfx.create': 'toolTitle.sfx.create',
    'transcriptions.create': 'toolTitle.transcriptions.create',
    'translations.create': 'toolTitle.translations.create',
  };
  const musicTitle = isRetrieve ? 'toolTitle.music.retrieve' : 'toolTitle.music.create';
  const titleKey = kind === 'audio' ? musicTitle : kind ? (titleKeys[`${kind}.${action}`] ?? null) : null;
  const fallbackMap: Record<string, string> = {
    'image.create': '生成图片',
    'image.retrieve': '查询图片结果',
    'video.create': '生成视频',
    'video.retrieve': '查询视频结果',
    'audio.create': '语音合成',
    'sfx.create': '生成音效',
    'transcriptions.create': '语音转文字',
    'translations.create': '语音翻译',
  };
  const fallback =
    kind === 'audio'
      ? isRetrieve
        ? '查询音乐结果'
        : '生成音乐'
      : (kind && fallbackMap[`${kind}.${action}`]) || raw;
  const mediaKind: ToolMediaKind | null =
    kind === 'image' || kind === 'video' || kind === 'audio' ? kind : null;
  return { titleKey, fallback, mediaKind, isCreate: !isRetrieve };
}

/** Parses accumulated tool arguments JSON into an object (null when absent or not an object). */
function parseToolArguments(raw?: string): Record<string, unknown> | null {
  if (!raw?.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/** Localized labels for known generation argument keys. */
const TOOL_ARG_LABELS: Record<string, { key: string; fallback: string }> = {
  prompt: { key: 'toolArgs.prompt', fallback: '提示词' },
  text: { key: 'toolArgs.text', fallback: '合成文本' },
  model: { key: 'toolArgs.model', fallback: '模型' },
  size: { key: 'toolArgs.size', fallback: '尺寸' },
  aspectRatio: { key: 'toolArgs.aspectRatio', fallback: '比例' },
  durationSeconds: { key: 'toolArgs.durationSeconds', fallback: '时长' },
  imageCount: { key: 'toolArgs.imageCount', fallback: '生成数量' },
  quality: { key: 'toolArgs.quality', fallback: '质量' },
  voice: { key: 'toolArgs.voice', fallback: '音色' },
  lyrics: { key: 'toolArgs.lyrics', fallback: '歌词' },
  tags: { key: 'toolArgs.tags', fallback: '风格标签' },
  negativeTags: { key: 'toolArgs.negativeTags', fallback: '回避标签' },
  seed: { key: 'toolArgs.seed', fallback: '随机种子' },
};

/** Argument keys rendered as quoted creative briefs instead of table rows. */
const QUOTED_ARG_KEYS = new Set(['prompt', 'text', 'lyrics']);
/** Argument keys hidden from the summary (noise for the user). */
const HIDDEN_ARG_KEYS = new Set(['callback_url', 'callbackUrl']);

interface ToolArgRow {
  /** i18n key for the localized label, null when the key is the raw field name. */
  labelKey: string | null;
  label: string;
  value: string;
  quoted?: boolean;
}

/** Builds localized, human-readable rows from parsed generation arguments. */
function buildArgRows(parsed: Record<string, unknown>): ToolArgRow[] {
  const rows: ToolArgRow[] = [];
  for (const [rawKey, rawValue] of Object.entries(parsed)) {
    if (HIDDEN_ARG_KEYS.has(rawKey)) continue;
    const labelMeta = TOOL_ARG_LABELS[rawKey];
    const label = labelMeta?.fallback ?? rawKey;
    const labelKey = labelMeta?.key ?? null;
    if (QUOTED_ARG_KEYS.has(rawKey) && typeof rawValue === 'string') {
      rows.push({ labelKey, label, value: rawValue, quoted: true });
      continue;
    }
    if (rawKey === 'durationSeconds' && typeof rawValue === 'number') {
      rows.push({ labelKey, label, value: String(rawValue) });
      continue;
    }
    if ((rawKey === 'referenceImages' || rawKey === 'inputAssetIds') && Array.isArray(rawValue)) {
      if (rawValue.length > 0) {
        rows.push({ labelKey, label, value: String(rawValue.length) });
      }
      continue;
    }
    if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
      rows.push({ labelKey, label, value: String(rawValue) });
    }
  }
  return rows;
}

/** Media-generation placeholder shown while a generation tool is running. */
const ToolMediaPlaceholder: React.FC<{ kind: ToolMediaKind }> = ({ kind }) => {
  const { t: tCommon } = useTranslation('common');
  const progressKey =
    kind === 'image' ? 'toolProgress.image' : kind === 'video' ? 'toolProgress.video' : 'toolProgress.audio';
  const progressFallback =
    kind === 'image' ? '图片生成中…' : kind === 'video' ? '视频生成中…' : '音频合成中…';
  const Icon = kind === 'image' ? ImageIcon : kind === 'video' ? Video : Volume2;
  return (
    <div className="mx-2 mb-2 flex items-center gap-3 rounded-md border border-gray-200/80 bg-gradient-to-r from-gray-100/80 to-gray-50/60 px-3 py-3 dark:border-gray-700/80 dark:from-[#2a2a2a] dark:to-[#232323]">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#e6f4ff] dark:bg-[#11263d]">
        <Icon size={18} className="text-[#1890ff]" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-200">
          <Loader2 size={12} className="animate-spin text-[#1890ff]" />
          {tCommon(progressKey, { defaultValue: progressFallback })}
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          {tCommon('toolPlaceholder.hint', { defaultValue: '通常需要十几秒，请稍候' })}
        </span>
      </div>
      <div className="ml-auto flex shrink-0 gap-1" aria-hidden>
        <span className="size-1.5 animate-bounce rounded-full bg-[#1890ff]/70 [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#1890ff]/50 [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#1890ff]/30 [animation-delay:300ms]" />
      </div>
    </div>
  );
};

/** Structured, localized rendering of one tool invocation's arguments. */
const ToolArgsSummary: React.FC<{ tool: ChatToolCall }> = ({ tool }) => {
  const { t: tCommon } = useTranslation('common');
  const parsed = parseToolArguments(tool.arguments);
  if (!parsed) {
    if (!tool.arguments?.trim()) return null;
    return (
      <pre className="max-h-56 overflow-auto border-t border-gray-200/80 px-2.5 py-2 text-xs whitespace-pre-wrap break-all text-gray-600 dark:border-gray-700/80 dark:text-gray-300">
        {tool.arguments}
      </pre>
    );
  }
  const rows = buildArgRows(parsed);
  const rowLabel = (row: ToolArgRow): string =>
    row.labelKey ? tCommon(row.labelKey, { defaultValue: row.label }) : row.label;
  const briefRows = rows.filter((row) => !row.quoted);
  const quoteRows = rows.filter((row) => row.quoted);
  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-200/80 px-2.5 py-2 dark:border-gray-700/80">
      {quoteRows.map((row) => (
        <blockquote
          key={row.label}
          className="rounded-md border-l-2 border-[#1890ff]/60 bg-[#e6f4ff]/60 px-2.5 py-1.5 text-xs leading-relaxed text-gray-700 dark:bg-[#11263d]/60 dark:text-gray-200"
        >
          <span className="mb-0.5 block text-[11px] text-gray-400 dark:text-gray-500">
            {rowLabel(row)}
          </span>
          {row.value}
        </blockquote>
      ))}
      {briefRows.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          {briefRows.map((row) => (
            <div key={row.label} className="col-span-2 grid grid-cols-subgrid">
              <dt className="shrink-0 text-gray-400 dark:text-gray-500">{rowLabel(row)}</dt>
              <dd className="min-w-0 break-all text-gray-600 dark:text-gray-300">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <details className="group/raw">
        <summary className="cursor-pointer select-none text-[11px] text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
          {tCommon('toolArgs.rawJson', { defaultValue: '原始参数' })}
        </summary>
        <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-gray-100/80 px-2 py-1.5 text-[11px] whitespace-pre-wrap break-all text-gray-500 dark:bg-[#161616] dark:text-gray-400">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      </details>
    </div>
  );
};

/** Renders one generated media asset inline below the tool card header. */
const ToolMediaResult: React.FC<{ tool: ChatToolCall }> = ({ tool }) => {
  const { t: tCommon } = useTranslation('common');
  const media = tool.media ?? [];
  if (media.length === 0) return null;
  const kinds = new Set(media.map((item) => item.kind));
  const label = kinds.size === 1
    ? mediaDoneLabel(media[0].kind)
    : { key: 'toolDone.media', fallback: '媒体已生成' };
  const images = media.filter((item) => item.kind === 'image');
  const others = media.filter((item) => item.kind !== 'image');
  return (
    <div className="flex flex-col gap-1.5 px-2 pb-2">
      {images.length > 1 && (
        <div className="grid grid-cols-2 gap-1.5">
          {images.map((item, index) => (
            <img
              key={mediaKey(item, index)}
              src={item.url}
              alt={tCommon('toolDone.image', { defaultValue: '图片已生成' })}
              loading="lazy"
              className="max-h-56 w-full rounded-md border border-gray-200/80 object-contain dark:border-gray-700/80"
            />
          ))}
        </div>
      )}
      {images.length === 1 && (
        <img
          key={mediaKey(images[0], 0)}
          src={images[0].url}
          alt={tCommon('toolDone.image', { defaultValue: '图片已生成' })}
          loading="lazy"
          className="max-h-72 w-auto max-w-full rounded-md border border-gray-200/80 object-contain dark:border-gray-700/80"
        />
      )}
      {others.map((item, index) => {
        if (item.kind === 'video') {
          return (
            <video
              key={mediaKey(item, index)}
              src={item.url}
              controls
              preload="metadata"
              className="max-h-72 w-full max-w-full rounded-md border border-gray-200/80 bg-black dark:border-gray-700/80"
            />
          );
        }
        return (
          <audio
            key={mediaKey(item, index)}
            src={item.url}
            controls
            className="w-full"
            preload="metadata"
          />
        );
      })}
      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
        {tCommon(label.key, { defaultValue: label.fallback })}
      </span>
    </div>
  );
};

/** Collapsible tool/skill/MCP invocation card. */
const ToolCallCard: React.FC<{ tool: ChatToolCall }> = ({ tool }) => {
  const { t: tCommon } = useTranslation('common');
  const [open, setOpen] = React.useState(false);
  const running = tool.status === 'running';
  const failed = tool.status === 'error';
  const display = resolveToolDisplay(tool.name);
  const progress = running ? mediaProgress(tool) : null;
  const hasMedia = (tool.media?.length ?? 0) > 0;
  const title = display.titleKey
    ? tCommon(display.titleKey, { defaultValue: display.fallback })
    : tool.name || tCommon('toolCall', { defaultValue: '工具调用' });
  return (
    <div
      className={cn(
        'mb-1.5 w-full overflow-hidden rounded-md border bg-gray-50/60 dark:bg-[#1f1f1f]',
        failed
          ? 'border-red-200/80 dark:border-red-900/60'
          : 'border-gray-200/80 dark:border-gray-700/80',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs text-gray-600 transition-colors hover:bg-gray-100/70 dark:text-gray-300 dark:hover:bg-[#2a2a2a]"
        aria-expanded={open}
      >
        {running ? (
          <Loader2 size={13} className="animate-spin text-[#1890ff]" />
        ) : tool.status === 'completed' ? (
          <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" />
        ) : (
          <Wrench size={13} className="text-gray-400" />
        )}
        <span className="truncate font-medium">{title}</span>
        {progress && (
          <span className="ml-1 shrink-0 text-[11px] text-[#1890ff]">
            {tCommon(progress.key, { defaultValue: progress.fallback })}
          </span>
        )}
        {failed && (
          <span className="ml-1 shrink-0 text-[11px] text-red-500 dark:text-red-400">
            {tCommon('toolFailed', { defaultValue: '执行失败' })}
          </span>
        )}
        {open ? (
          <ChevronDown size={13} className="ml-auto shrink-0" />
        ) : (
          <ChevronRight size={13} className="ml-auto shrink-0" />
        )}
      </button>
      {running && display.isCreate && display.mediaKind && (
        <ToolMediaPlaceholder kind={display.mediaKind} />
      )}
      {hasMedia && !running && <ToolMediaResult tool={tool} />}
      {open && tool.error && (
        <pre className="max-h-40 overflow-auto border-t border-red-200/80 px-2.5 py-2 text-xs whitespace-pre-wrap break-all text-red-600 dark:border-red-900/60 dark:text-red-300">
          {tool.error}
        </pre>
      )}
      {open && <ToolArgsSummary tool={tool} />}
    </div>
  );
};

export const BotMessageItem: React.FC<BotMessageItemProps> = ({
  message,
  copiedId,
  feedback,
  handleCopy,
  handleFeedback,
  onOpenArtifact,
  isStreaming = false,
}) => {
  const { t: tCommon } = useTranslation('common');
  // Reasoning phase: the turn is streaming and no answer text has arrived
  // yet, so every incoming delta is still reasoning/thinking content.
  const reasoningActive = isStreaming && Boolean(message.reasoning) && !message.text;
  const showTypingIndicator = isStreaming && !message.text && !message.reasoning;

  return (
    <div className="chat-markdown-assistant group relative flex w-full min-w-0 items-start">
      <div className="relative flex w-full min-w-0 flex-col gap-1.5 text-[15px] leading-[1.75]">
        {message.reasoning && (
          <ThinkingBlock
            content={message.reasoning}
            streaming={isStreaming}
            active={reasoningActive}
          />
        )}

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-1 flex max-w-full w-full flex-col gap-0 text-xs">
            {message.toolCalls.map((tool) => (
              <ToolCallCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {message.failure ? (
          <ChatFailureCard failure={message.failure} />
        ) : showTypingIndicator ? (
          <TypingIndicator />
        ) : (
          <MarkdownRenderer
            content={message.text}
            onOpenArtifact={onOpenArtifact}
            streaming={isStreaming}
          />
        )}

        {!isStreaming && message.text && (
          <div className="mt-0.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => handleCopy(message.text, message.id)}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-[#e5e5e5] hover:text-gray-900 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-200"
              title={tCommon('copy')}
            >
              {copiedId === message.id ? (
                <Check size={14} className="text-emerald-500 dark:text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleFeedback(message.id, 'up')}
              className={cn(
                'rounded-md p-1.5 transition-colors hover:bg-[#e5e5e5] dark:hover:bg-[#2f2f2f]',
                feedback[message.id] === 'up'
                  ? 'text-[#1890ff]'
                  : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
              )}
              title={tCommon('goodResponse')}
            >
              <ThumbsUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleFeedback(message.id, 'down')}
              className={cn(
                'rounded-md p-1.5 transition-colors hover:bg-[#e5e5e5] dark:hover:bg-[#2f2f2f]',
                feedback[message.id] === 'down'
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
              )}
              title={tCommon('badResponse')}
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
