import React from 'react';
import { cn } from '../MarkdownRenderer';
import { useAdaptiveDropdown } from '../../hooks/useAdaptiveDropdown';
import type { CreativeModelDuration } from '../../creative-model-catalog';

interface MusicSettingsDropdownProps {
  musicSmartDuration: boolean;
  setMusicSmartDuration: (val: boolean) => void;
  musicDuration: number;
  setMusicDuration: (val: number) => void;
  musicSettingsPlacement: 'top' | 'bottom';
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  /** Duration control the selected model accepts; `null` when the vendor decides. */
  durationRange?: CreativeModelDuration | null;
  /** Whether the model offers a vendor-chosen length ("智能时长"). */
  smartDuration?: boolean;
}

/**
 * Tick values rendered under the music slider: five evenly spaced marks
 * between the model's accepted minimum and maximum.
 * @param range - the selected model's duration control.
 * @returns ascending tick seconds.
 */
function durationTicks(range: CreativeModelDuration): number[] {
  const span = range.maxSeconds - range.minSeconds
  const step = Math.max(range.stepSeconds, Math.ceil(span / 5 / range.stepSeconds) * range.stepSeconds)
  const ticks: number[] = []
  for (let value = range.minSeconds; value <= range.maxSeconds; value += step) ticks.push(value)
  if (ticks[ticks.length - 1] !== range.maxSeconds) ticks.push(range.maxSeconds)
  return ticks
}

export const MusicSettingsDropdown: React.FC<MusicSettingsDropdownProps> = ({
  musicSmartDuration,
  setMusicSmartDuration,
  musicDuration,
  setMusicDuration,
  musicSettingsPlacement,
  dropdownRef,
  durationRange,
  smartDuration = false
}) => {
  const range = durationRange ?? null;
  const ticks = range ? durationTicks(range) : [];
  const { placement, maxHeight } = useAdaptiveDropdown(dropdownRef, musicSettingsPlacement, 300);
  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute left-0 sm:left-[80px] w-[calc(100vw-32px)] sm:w-[380px] max-w-[380px] bg-white rounded-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-4 overflow-y-auto custom-scrollbar dark:bg-[#222222]",
        placement === 'top' ? "bottom-full mb-2" : "top-full mt-2"
      )}
      style={{ maxHeight: maxHeight === null ? '50vh' : `${maxHeight}px` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-zinc-700 dark:text-zinc-300 font-medium">选择音乐生成时长</span>
        {range && smartDuration && (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMusicSmartDuration(!musicSmartDuration)}>
            <span className="text-[13px] text-zinc-500 dark:text-zinc-400">智能时长</span>
            <div className={cn("w-10 h-5 rounded-full flex items-center px-[2px] transition-colors", musicSmartDuration ? "bg-[#165DFF] justify-end" : "bg-zinc-600 justify-start")}>
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
        <div className="flex items-center gap-4 mt-2">
          <div className="flex-1 relative pb-6 pt-2">
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-1.5 pointer-events-none z-0">
              {ticks.map((val) => (
                <div key={val} className="w-0.5 h-2 bg-black/20 dark:bg-[#444444] rounded-full" />
              ))}
            </div>
            <input
              type="range"
              min={range.minSeconds}
              max={range.maxSeconds}
              step={range.stepSeconds}
              value={musicDuration}
              onChange={(e) => {
                setMusicDuration(parseInt(e.target.value));
                setMusicSmartDuration(false);
              }}
              className="w-full relative z-10 h-2 bg-black/5 dark:bg-[#2f2f2f] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-sm focus:outline-none"
              style={{
                opacity: musicSmartDuration ? 0.5 : 1,
              }}
            />
            <div className="absolute left-0 right-0 bottom-0 flex justify-between text-[11px] text-zinc-500 font-medium pointer-events-none">
              {ticks.map((val) => (
                <span key={val} className="w-6 text-center">{val}</span>
              ))}
            </div>
          </div>
          <div className="w-[70px] h-9 bg-black/5 dark:bg-[#2f2f2f] rounded-lg flex items-center justify-between px-3 text-[14px] font-medium text-zinc-700 dark:text-zinc-300 transition-colors shrink-0">
            <input
              type="text"
              value={musicDuration}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  setMusicDuration(val);
                  setMusicSmartDuration(false);
                }
              }}
              className="w-full bg-transparent outline-none p-0 text-zinc-900 dark:text-white"
            />
            <span className="text-zinc-500">s</span>
          </div>
        </div>
      )}
    </div>
  );
};
