import React from 'react';
import { Sparkles, RotateCcw, LayoutGrid, Trash2 } from 'lucide-react';
import { cn } from '@sdkwork/agents-pc-commons';
import { CreativeMessage } from '../types';
import { GridLayout } from './GridLayout';
import { MasonryLayout } from './MasonryLayout';
import { CarouselLayout } from './CarouselLayout';

interface CreativeMessageItemProps {
  message: CreativeMessage;
  layout: 'grid' | 'masonry' | 'carousel';
  carouselIndex: number;
  onPreviewImage: (message: CreativeMessage, index: number) => void;
  onSetCarouselIndex: (index: number) => void;
  onToggleLayout: () => void;
  onSend: (text: string, mode: string) => void;
  onDelete: () => void;
}

export const CreativeMessageItem: React.FC<CreativeMessageItemProps> = ({
  message: m,
  layout,
  carouselIndex: activeIdx,
  onPreviewImage,
  onSetCarouselIndex,
  onToggleLayout,
  onSend,
  onDelete
}) => {
  return (
    <div className="w-full flex flex-col gap-3 group pb-8 last:pb-0 animate-in fade-in duration-300">

      {/* Prompt Title & Model Info */}
      <div className="flex items-center justify-between gap-4 w-full select-none">
        <div className="text-[14px] font-medium text-zinc-800 leading-relaxed dark:text-zinc-200">
          {m.text}
        </div>
        <div className="flex items-center gap-1.5 text-[var(--ag-color-text-secondary,#5B6B88)] text-[11px] font-medium shrink-0">
          <span>{m.modelInfo || '图片 5.0 Lite | 1:1 | 2K'}</span>
          <span className="cursor-pointer hover:text-[var(--ag-color-text-primary,#0A1B3D)] transition-colors flex items-center gap-0.5">
            详细信息 ⓘ
          </span>
        </div>
        </div>

      {/* Rendering stage styles */}
      {m.stage === 'failed' ? (
        /* Terminal failure card: honest state, with a one-click redo */
        <div className="w-full min-h-[120px] bg-rose-500/5 rounded-2xl flex flex-col items-center justify-center gap-2 p-6 dark:bg-rose-400/5">
          <span className="text-rose-600 dark:text-rose-400 text-[13px] font-medium">
            {m.errorText || '本次生成失败'}
          </span>
          {m.text ? (
            <button
              onClick={() => onSend(m.text || '', m.mode || 'image')}
              className="px-3 py-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-black/5 transition-colors text-xs font-medium cursor-pointer dark:text-zinc-300 dark:hover:text-white dark:hover:bg-[#2a2a2a]"
            >
              <RotateCcw size={13} className="inline mr-1 -mt-0.5" />
              重新生成
            </button>
          ) : null}
        </div>
      ) : m.stage === 'thinking' || m.stage === 'loading' ? (
        /* Progress thinking / loading card */
        <div className="w-full aspect-[2.39/1] min-h-[220px] bg-zinc-100 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden dark:bg-[#222222]">
          {/* Reference preview: the upload the command is generating from,
              dimmed under the scan animation until the vendor result replaces it. */}
          {m.previewUrl ? (
            <img
              src={m.previewUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-25 blur-sm scale-105 select-none pointer-events-none"
            />
          ) : null}
          {m.stage === 'thinking' ? (
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div className="w-6 h-6 rounded-full border-2 border-[#4080FF] border-t-transparent animate-spin shrink-0" />
              <span className="text-zinc-500 dark:text-zinc-300 text-xs font-medium animate-pulse bg-black/30 dark:bg-black/40 px-2 py-0.5 rounded-md">
                {m.stageLabel || '排队中'}
              </span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              {/* Status Badge: real stage, not a fabricated percentage */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4080FF] animate-pulse" />
                <span>{m.stageLabel || '生成中'}</span>
              </div>

              {/* Scanning bar animation */}
              <div className="absolute inset-x-0 h-0.5 bg-[#165DFF]/50 scanner-bar z-10" />

              <Sparkles size={20} className="text-zinc-600 dark:text-zinc-300 animate-pulse mb-2 relative z-10" />
              <span className="text-zinc-600 dark:text-zinc-300 text-[11px] font-medium relative z-10 bg-black/30 dark:bg-black/40 px-2 py-0.5 rounded-md">
                {m.stageLabel || '生成中'}
              </span>
              {m.previewUrl ? (
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-1 relative z-10">
                  预览参考 · 生成完成后展示结果
                </span>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        /* Completed Stage: Dynamic Layout Modes */
        <div className="w-full">
          {layout === 'masonry' ? (
            <MasonryLayout message={m} onPreviewImage={onPreviewImage} />
          ) : layout === 'carousel' ? (
            <CarouselLayout message={m} activeIdx={activeIdx} onSetCarouselIndex={onSetCarouselIndex} onPreviewImage={onPreviewImage} />
          ) : (
            <GridLayout message={m} onPreviewImage={onPreviewImage} />
          )}

          {/* Action buttons row below images */}
          <div className="flex items-center gap-2 mt-4 select-none relative">
            <button
              onClick={() => onSend(m.text || '', m.mode || 'agent')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-black/5 transition-colors text-xs font-medium cursor-pointer dark:text-zinc-300 dark:hover:text-white dark:hover:bg-[#2a2a2a]"
            >
              <RotateCcw size={13} />
              重新生成
            </button>
            <button
              onClick={onToggleLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-black/5 transition-colors text-xs font-medium cursor-pointer dark:text-zinc-300 dark:hover:text-white dark:hover:bg-[#2a2a2a]"
            >
              <LayoutGrid size={13} />
              切换排版
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors text-xs font-medium cursor-pointer dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/5"
            >
              <Trash2 size={13} />
              删除记录
            </button>
          </div>

          {/* Creative Suggestions (Inspired by Octo / MJ style prompt hints) */}
          {m.suggestions && m.suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-zinc-500 text-[11px] font-medium py-1.5 mr-1 select-none">试试：</span>
              {m.suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => onSend(sug, 'agent')}
                  className="bg-zinc-100 hover:bg-zinc-200 rounded-full px-3 py-1.5 text-[11px] text-zinc-600 hover:text-zinc-900 transition-colors flex items-center gap-1.5 group cursor-pointer dark:bg-[#2a2a2a] dark:hover:bg-[#333333] dark:text-zinc-300 dark:hover:text-white"
                >
                  <Sparkles size={10} className="text-[#165DFF] group-hover:text-[#4080FF]" />
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
