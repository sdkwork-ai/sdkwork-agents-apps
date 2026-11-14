import React from 'react';
import { cn } from '../MarkdownRenderer';
import { useAdaptiveDropdown } from '../../hooks/useAdaptiveDropdown';
import type { CreativeModelDuration } from '../../creative-model-catalog';

interface SoundEffectSettingsDropdownProps {
  sfxDuration: number;
  setSfxDuration: (seconds: number) => void;
  sfxLoop: boolean;
  setSfxLoop: (loop: boolean) => void;
  sfxSettingsPlacement: 'top' | 'bottom';
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  /** Duration control the selected model accepts; `null` when the vendor decides. */
  durationRange?: CreativeModelDuration | null;
  /** Whether the vendor supports seamless looping. */
  supportsLoop?: boolean;
}

export const SoundEffectSettingsDropdown: React.FC<SoundEffectSettingsDropdownProps> = ({
  sfxDuration,
  setSfxDuration,
  sfxLoop,
  setSfxLoop,
  sfxSettingsPlacement,
  dropdownRef,
  durationRange,
  supportsLoop = false
}) => {
  const range = durationRange ?? null;
  const { placement, maxHeight } = useAdaptiveDropdown(dropdownRef, sfxSettingsPlacement, 300);
  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute left-0 sm:left-[80px] w-[calc(100vw-32px)] sm:w-[360px] max-w-[360px] bg-white rounded-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-4 overflow-y-auto custom-scrollbar dark:bg-[#222222]",
        placement === 'top' ? "bottom-full mb-2" : "top-full mt-2"
      )}
      style={{ maxHeight: maxHeight === null ? '50vh' : `${maxHeight}px` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-zinc-700 dark:text-zinc-300 font-medium">音效时长</span>
        {supportsLoop && (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSfxLoop(!sfxLoop)}>
            <span className="text-[13px] text-zinc-500 dark:text-zinc-400">循环播放</span>
            <div className={cn("w-10 h-5 rounded-full flex items-center px-[2px] transition-colors", sfxLoop ? "bg-[#165DFF] justify-end" : "bg-zinc-600 justify-start")}>
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {!range ? (
        <div className="text-[12px] text-zinc-500 dark:text-zinc-400 py-1">
          该模型由服务商决定时长
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={range.minSeconds}
            max={range.maxSeconds}
            step={range.stepSeconds}
            value={sfxDuration}
            onChange={(e) => setSfxDuration(Number(e.target.value))}
            className="flex-1 h-[3px] bg-black/10 dark:bg-[#333333] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all focus:outline-none"
          />
          <div className="w-16 h-8 bg-black/5 dark:bg-[#2f2f2f] rounded-lg flex items-center justify-center text-sm shrink-0">
            <span className="font-medium text-zinc-900 dark:text-white">{sfxDuration}</span>
            <span className="text-zinc-500 ml-1">s</span>
          </div>
        </div>
      )}
      {range && (sfxDuration < range.minSeconds || sfxDuration > range.maxSeconds) && (
        <span className="text-[11px] text-amber-500">
          该模型支持 {range.minSeconds}–{range.maxSeconds} 秒
        </span>
      )}
    </div>
  );
};
