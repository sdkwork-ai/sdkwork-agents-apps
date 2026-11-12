import React from 'react';
import { PenTool, LayoutTemplate, Scan, Sparkles, Volume2 } from 'lucide-react';
import { cn } from '../MarkdownRenderer';
import type { CreativeModelDuration } from '../../creative-model-catalog';

// Ratio Icon
const RatioIcon = ({ ratio, active }: { ratio: string, active: boolean }) => {
  let width = 16;
  let height = 16;
  if (ratio === '21:9') { width = 18; height = 8; }
  else if (ratio === '16:9') { width = 16; height = 9; }
  else if (ratio === '3:2') { width = 15; height = 10; }
  else if (ratio === '4:3') { width = 16; height = 12; }
  else if (ratio === '1:1') { width = 14; height = 14; }
  else if (ratio === '3:4') { width = 12; height = 16; }
  else if (ratio === '2:3') { width = 10; height = 15; }
  else if (ratio === '9:16') { width = 9; height = 16; }

  return (
    <div className="h-5 flex items-center justify-center mb-1">
      <div
        style={{ width: `${width}px`, height: `${height}px` }}
        className={cn("border-[1.5px] rounded-[3px] transition-colors", active ? "border-[#165DFF]" : "border-[#8A97AD]")}
      />
    </div>
  );
};

/** Composer reference modes and their labels, in display order. */
const VIDEO_MODE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  all_around: { label: '全能参考', icon: <PenTool size={14} /> },
  first_last: { label: '首尾帧', icon: <LayoutTemplate size={14} /> },
  smart_multi: { label: '智能多帧', icon: <Scan size={14} /> },
};

interface VideoSettingsDropdownProps {
  videoSettingsMode: 'all_around' | 'first_last' | 'smart_multi';
  setVideoSettingsMode: (mode: 'all_around' | 'first_last' | 'smart_multi') => void;
  videoRatio: string;
  setVideoRatio: (ratio: string) => void;
  videoResolution: string;
  setVideoResolution: (resolution: string) => void;
  videoDuration: number;
  setVideoDuration: (duration: number) => void;
  videoSettingsPlacement: 'top' | 'bottom';
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  /** Modes the selected model can dispatch; `undefined` means unprofiled. */
  modeOptions?: readonly ('all_around' | 'first_last' | 'smart_multi')[];
  /** Aspect ratios the selected model accepts. */
  ratioOptions?: readonly string[];
  /** Uppercase resolution tiers the selected model accepts. */
  resolutionOptions?: readonly string[];
  /** Duration control the selected model accepts; `null` when the vendor decides. */
  durationRange?: CreativeModelDuration | null;
  /** Whether the model returns synchronized audio. */
  outputAudio?: boolean;
  /** Current audio choice for a model that supports audio. */
  audio?: boolean;
  setAudio?: (audio: boolean) => void;
}

export const VideoSettingsDropdown: React.FC<VideoSettingsDropdownProps> = ({
  videoSettingsMode,
  setVideoSettingsMode,
  videoRatio,
  setVideoRatio,
  videoResolution,
  setVideoResolution,
  videoDuration,
  setVideoDuration,
  videoSettingsPlacement,
  dropdownRef,
  modeOptions,
  ratioOptions,
  resolutionOptions,
  durationRange,
  outputAudio = false,
  audio = true,
  setAudio
}) => {
  const modes = modeOptions && modeOptions.length > 0
    ? modeOptions
    : (['all_around', 'first_last', 'smart_multi'] as const);
  const ratios = ratioOptions && ratioOptions.length > 0
    ? ratioOptions
    : ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'];
  const resolutions = resolutionOptions && resolutionOptions.length > 0
    ? resolutionOptions
    : ['720P', '1080P'];
  const discreteDurations = durationRange?.values ?? [];
  const hasDurationKnob = durationRange !== null && durationRange !== undefined;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute left-0 sm:left-[80px] w-[calc(100vw-32px)] sm:w-[420px] max-w-[420px] bg-white rounded-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar dark:bg-[#222222]",
        videoSettingsPlacement === 'top' ? "bottom-full mb-2" : "top-full mt-2"
      )}
    >
      <div className="flex bg-zinc-100 rounded-xl p-1 dark:bg-[#2a2a2a]">
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => setVideoSettingsMode(mode)}
            className={cn("flex-1 py-2 text-[13px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5", videoSettingsMode === mode ? "bg-white text-zinc-900 dark:bg-[#333333] dark:text-white" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200")}
          >
            {VIDEO_MODE_LABELS[mode].icon} {VIDEO_MODE_LABELS[mode].label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-[12px] text-zinc-500 font-medium">选择比例</div>
        <div className="flex justify-between gap-1.5">
          {ratios.map(ratio => (
            <button
              key={ratio}
              onClick={() => setVideoRatio(ratio)}
              className={cn("flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-colors", videoRatio === ratio ? "bg-black/10 text-zinc-900 dark:bg-[#333333] dark:text-white" : "text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-[#2a2a2a]")}
            >
              <RatioIcon ratio={ratio} active={videoRatio === ratio} />
              <span className="text-[11px] font-medium">{ratio}</span>
            </button>
          ))}
        </div>
        </div>

      <div className="flex flex-col gap-3">
        <div className="text-[12px] text-zinc-500 font-medium flex items-center justify-between">
          <span>选择分辨率</span>
          {outputAudio && setAudio !== undefined && (
            <button
              onClick={() => setAudio(!audio)}
              className={cn(
                "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-colors",
                audio
                  ? "text-[#4080FF] bg-[#4080FF]/10"
                  : "text-zinc-500 bg-black/5 dark:bg-[#2a2a2a] dark:text-zinc-400"
              )}
            >
              <Volume2 size={11} /> {audio ? '含音频' : '无音频'}
            </button>
          )}
        </div>
        <div className="flex gap-2.5">
          {resolutions.map(resolution => (
            <button
              key={resolution}
              onClick={() => setVideoResolution(resolution)}
              className={cn("flex-1 py-2.5 rounded-xl transition-colors text-[13px] font-medium", videoResolution.toUpperCase() === resolution.toUpperCase() ? "bg-black/10 text-zinc-900 dark:bg-[#333333] dark:text-white" : "bg-black/5 text-zinc-500 dark:bg-[#2f2f2f] dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-[#333333]")}
            >
              {resolution}
              {resolution === '1080P' && <Sparkles size={10} className="inline text-[#4080FF] fill-[#4080FF] -mt-0.5 ml-0.5" />}
            </button>
          ))}
        </div>
        </div>

      <div className="flex flex-col gap-3">
        <div className="text-[12px] text-zinc-500 font-medium">时长</div>
        {!hasDurationKnob ? (
          <div className="text-[12px] text-zinc-500 dark:text-zinc-400 py-2">
            该模型由服务商决定时长
          </div>
        ) : discreteDurations.length > 0 ? (
          <div className="flex gap-2.5">
            {discreteDurations.map(seconds => (
              <button
                key={seconds}
                onClick={() => setVideoDuration(seconds)}
                className={cn("flex-1 py-2.5 rounded-xl transition-colors text-[13px] font-medium", videoDuration === seconds ? "bg-black/10 text-zinc-900 dark:bg-[#333333] dark:text-white" : "bg-black/5 text-zinc-500 dark:bg-[#2f2f2f] dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-[#333333]")}
              >
                {seconds}s
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={durationRange?.minSeconds ?? 1}
              max={durationRange?.maxSeconds ?? 10}
              step={durationRange?.stepSeconds ?? 1}
              value={videoDuration}
              onChange={(e) => setVideoDuration(Number(e.target.value))}
              className="flex-1 h-[3px] bg-black/10 dark:bg-[#333333] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all focus:outline-none"
            />
            <div className="w-16 h-8 bg-black/5 dark:bg-[#2f2f2f] rounded-lg flex items-center justify-center text-sm shrink-0">
              <span className="font-medium text-zinc-900 dark:text-white">{videoDuration}</span>
              <span className="text-zinc-500 ml-1">s</span>
            </div>
          </div>
        )}
        {isDurationOutOfRange(videoDuration, durationRange) && (
          <span className="text-[11px] text-amber-500">
            该模型支持 {durationRange?.minSeconds}–{durationRange?.maxSeconds} 秒
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Whether a duration sits outside the model's accepted range.
 * @param seconds - selected duration.
 * @param range - the model's duration control.
 * @returns whether the picker should warn.
 */
function isDurationOutOfRange(
  seconds: number,
  range: CreativeModelDuration | null | undefined,
): boolean {
  if (!range) return false
  return seconds < range.minSeconds || seconds > range.maxSeconds
}
