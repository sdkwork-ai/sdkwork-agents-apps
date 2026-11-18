import React from 'react';
import { Link2, Link2Off } from 'lucide-react';
import { cn } from '../MarkdownRenderer';
import { useAdaptiveDropdown } from '../../hooks/useAdaptiveDropdown';
import {
  IMAGE_RATIO_OPTIONS,
  IMAGE_RESOLUTION_OPTIONS,
  imageDimensionsFor,
} from './imageDimensions';

// Ratio Icon specifically designed for all aspect ratios
const ImageRatioIcon = ({ ratio, active }: { ratio: string; active: boolean }) => {
  let width = 16;
  let height = 16;

  if (ratio === '21:9') { width = 18; height = 8; }
  else if (ratio === '16:9') { width = 16; height = 9; }
  else if (ratio === '3:2') { width = 15; height = 10; }
  else if (ratio === '4:3') { width = 15; height = 11; }
  else if (ratio === '1:1') { width = 13; height = 13; }
  else if (ratio === '3:4') { width = 11; height = 15; }
  else if (ratio === '2:3') { width = 10; height = 15; }
  else if (ratio === '9:16') { width = 9; height = 16; }

  if (ratio === 'smart' || ratio === '智能') {
    return (
      <div className="h-5 flex items-center justify-center mb-1">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={active ? "currentColor" : "#71717a"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors"
        >
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <rect x="8" y="8" width="8" height="8" rx="1" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  return (
    <div className="h-5 flex items-center justify-center mb-1">
      <div
        style={{ width: `${width}px`, height: `${height}px` }}
        className={cn(
          "border-[1.5px] rounded-[3px] transition-colors",
          active ? "border-[#165DFF]" : "border-[#8A97AD]"
        )}
      />
    </div>
  );
};

interface ImageSettingsDropdownProps {
  imageRatio: string;
  setImageRatio: (ratio: string) => void;
  imageResolution: string;
  setImageResolution: (resolution: string) => void;
  imageWidth: number;
  setImageWidth: (w: number) => void;
  imageHeight: number;
  setImageHeight: (h: number) => void;
  imageAspectRatioLocked: boolean;
  setImageAspectRatioLocked: (locked: boolean) => void;
  imageSettingsPlacement: 'top' | 'bottom';
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  /** Images generated per command. */
  imageCount?: number;
  setImageCount?: (count: number) => void;
  /** Maximum images per command the selected model accepts. */
  maxCount?: number;
  /** Aspect ratios the selected model accepts; `undefined` means unprofiled. */
  ratioOptions?: readonly string[];
  /** Resolution tiers the selected model accepts; `undefined` means unprofiled. */
  resolutionOptions?: readonly string[];
  /** Whether the selected model accepts free-form pixel sizes. */
  customSize?: boolean;
}

const getRatioFactor = (ratio: string): number => {
  if (ratio === '智能') return 1;
  const parts = ratio.split(':');
  if (parts.length === 2) {
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (!isNaN(w) && !isNaN(h) && h !== 0) {
      return w / h;
    }
    }
  return 1;
};

export const ImageSettingsDropdown: React.FC<ImageSettingsDropdownProps> = ({
  imageRatio,
  setImageRatio,
  imageResolution,
  setImageResolution,
  imageWidth,
  setImageWidth,
  imageHeight,
  setImageHeight,
  imageAspectRatioLocked,
  setImageAspectRatioLocked,
  imageSettingsPlacement,
  dropdownRef,
  imageCount = 1,
  setImageCount,
  maxCount = 1,
  ratioOptions,
  resolutionOptions,
  customSize = true
}) => {
  const ratios = ratioOptions && ratioOptions.length > 0 ? ratioOptions : IMAGE_RATIO_OPTIONS;
  const resolutions = resolutionOptions && resolutionOptions.length > 0 ? resolutionOptions : IMAGE_RESOLUTION_OPTIONS;
  const recommended = [
    { ratio: '1:1', label: '1:1 正方形', desc: '社交头像 / 设计插画' },
    { ratio: '16:9', label: '16:9 电脑宽屏', desc: '影视壁纸 / 宣传横幅' },
    { ratio: '9:16', label: '9:16 手机竖屏', desc: '小红书 / 抖音短视频' },
  ].filter((preset) => ratios.includes(preset.ratio));

  // Update dimensions when ratio or resolution changes
  const updateDimensions = (ratio: string, resolution: string) => {
    const dims = imageDimensionsFor(ratio, resolution);
    setImageWidth(dims.w);
    setImageHeight(dims.h);
  };

  const handleRatioSelect = (ratio: string) => {
    setImageRatio(ratio);
    updateDimensions(ratio, imageResolution);
  };

  const handleResolutionSelect = (res: string) => {
    setImageResolution(res);
    updateDimensions(imageRatio, res);
  };

  const handleWidthChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setImageWidth(0);
      return;
    }
    setImageWidth(num);
    if (imageAspectRatioLocked) {
      const factor = getRatioFactor(imageRatio);
      setImageHeight(Math.round(num / factor));
    }
  };

  const handleHeightChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setImageHeight(0);
      return;
    }
    setImageHeight(num);
    if (imageAspectRatioLocked) {
      const factor = getRatioFactor(imageRatio);
      setImageWidth(Math.round(num * factor));
    }
  };

  const { placement, maxHeight } = useAdaptiveDropdown(dropdownRef, imageSettingsPlacement, 440);

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute left-0 sm:left-[110px] w-[calc(100vw-32px)] sm:w-[410px] max-w-[410px] bg-white rounded-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-5 overflow-y-auto custom-scrollbar select-none dark:bg-[#1e1e1e]",
        placement === 'top' ? "bottom-full mb-2" : "top-full mt-2"
      )}
      style={{ maxHeight: maxHeight === null ? '60vh' : `${maxHeight}px` }}
    >
      {/* Aspect Ratio Section */}
      <div className="flex flex-col gap-4">
        {/* Recommended Presets Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
              <span>常用预设比例</span>
                <span className="bg-[#165DFF]/10 text-[#4080FF] text-[8px] font-bold px-1 py-0.5 rounded scale-90 origin-left">
                推荐
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">点击快速应用</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {recommended.map(preset => (
              <button
                key={preset.ratio}
                onClick={() => handleRatioSelect(preset.ratio)}
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl transition-all text-left cursor-pointer select-none",
                  imageRatio === preset.ratio
                  ? "bg-[#165DFF]/10 text-[#4080FF]"
                  : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:bg-[#252525] dark:text-zinc-400 dark:hover:bg-[#2a2a2a] dark:hover:text-zinc-200"
                )}
              >
                <div className="h-5 flex items-center justify-center mb-1.5">
                  {preset.ratio === '1:1' && (
                    <div className={cn("w-[12px] h-[12px] border-[1.5px] rounded-sm transition-colors", imageRatio === preset.ratio ? "border-[#165DFF]" : "border-[#8A97AD]")} />
                  )}
                  {preset.ratio === '16:9' && (
                    <div className={cn("w-[18px] h-[10px] border-[1.5px] rounded-sm transition-colors", imageRatio === preset.ratio ? "border-[#165DFF]" : "border-[#8A97AD]")} />
                  )}
                  {preset.ratio === '9:16' && (
                    <div className={cn("w-[10px] h-[18px] border-[1.5px] rounded-sm transition-colors", imageRatio === preset.ratio ? "border-[#165DFF]" : "border-[#8A97AD]")} />
                  )}
                </div>
                <span className="font-bold text-[12px] leading-tight text-center">{preset.label}</span>
                <span className="text-[8px] text-zinc-500 mt-1 text-center scale-95 font-medium leading-tight">{preset.desc}</span>
              </button>
            ))}
          </div>
          </div>

        {/* Regular Ratios Grid */}
        <div className="flex flex-col gap-2">
          <div className="text-[12px] text-zinc-500 font-semibold">所有比例</div>
          <div className="grid grid-cols-5 gap-2">
            {ratios.map(ratio => (
              <button
                key={ratio}
                onClick={() => handleRatioSelect(ratio)}
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center py-2.5 rounded-xl transition-all text-[11px] font-medium cursor-pointer",
                  imageRatio === ratio
                  ? "bg-zinc-100 text-zinc-900 dark:bg-[#333333] dark:text-white"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#2a2a2a] dark:hover:text-white"
                )}
              >
                <ImageRatioIcon ratio={ratio} active={imageRatio === ratio} />
                <span>{ratio}</span>
              </button>
            ))}
          </div>
          </div>
          </div>

      {/* Resolution Section */}
      <div className="flex flex-col gap-3">
        <div className="text-[12px] text-zinc-500 font-medium">选择分辨率</div>
        <div className="flex gap-2.5 relative">
          {resolutions.map((resolution) => (
            <div key={resolution} className="flex-1 relative flex flex-col pt-2.5">
              {resolution === '1K' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#4080FF]/20 text-[#4080FF] px-1.5 py-0.5 rounded-md text-[9px] font-bold scale-90 whitespace-nowrap z-20">
                  限免1次
                </span>
              )}
              <button
                onClick={() => handleResolutionSelect(resolution)}
                className={cn(
                  "w-full py-2.5 rounded-xl transition-all text-[13px] font-medium cursor-pointer flex items-center justify-center gap-1",
                  imageResolution === resolution
                  ? "bg-zinc-100 text-zinc-900 dark:bg-[#333333] dark:text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-[#2f2f2f] dark:text-zinc-400 dark:hover:bg-[#333333] dark:hover:text-white"
                )}
              >
                <span>{resolution === '1K' ? '标清 1K' : resolution === '2K' ? '高清 2K' : '超清 4K'}</span>
                {resolution !== '1K' && <span className="text-[#4080FF] text-xs font-semibold">✦</span>}
              </button>
            </div>
          ))}
          </div>
          </div>

      {maxCount > 1 && setImageCount !== undefined && (
        <div className="flex flex-col gap-3">
          <div className="text-[12px] text-zinc-500 font-medium">生成数量</div>
          <div className="flex gap-2.5">
            {Array.from({ length: maxCount }, (_, index) => index + 1).map((count) => (
              <button
                key={count}
                onClick={() => setImageCount(count)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl transition-all text-[13px] font-medium cursor-pointer",
                  imageCount === count
                  ? "bg-zinc-100 text-zinc-900 dark:bg-[#333333] dark:text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-[#2f2f2f] dark:text-zinc-400 dark:hover:bg-[#333333] dark:hover:text-white"
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual Dimensions Section */}
      <div className="flex flex-col gap-3">
        <div className="text-[12px] text-zinc-500 font-medium flex items-center justify-between">
          <span>尺寸</span>
          {!customSize && <span className="text-[10px] text-zinc-500">该模型由所选比例决定尺寸</span>}
        </div>
        <div className={cn("flex items-center gap-3", !customSize && "opacity-60")}>
          {/* Width Input */}
          <div className="flex-1 flex items-center bg-zinc-100 rounded-xl px-3 py-2 transition-all dark:bg-[#252525]">
            <span className="text-zinc-400 text-xs font-medium mr-2 select-none dark:text-zinc-500">W</span>
            <input
              type="text"
              value={imageWidth || ''}
              disabled={!customSize}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="w-full bg-transparent outline-none text-right font-mono text-[13px] text-zinc-900 dark:text-white"
            />
          </div>

          {/* Aspect Ratio Lock Button */}
          <button
            onClick={() => setImageAspectRatioLocked(!imageAspectRatioLocked)}
            className={cn(
              "p-2 rounded-lg transition-colors cursor-pointer",
              imageAspectRatioLocked
              ? "bg-zinc-100 text-[#0E42D2] hover:text-[#0E42D2] dark:bg-[#2f2f2f] dark:text-[#4080FF] dark:hover:text-[#4080FF]"
              : "bg-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            )}
            title={imageAspectRatioLocked ? "解除比例锁定" : "锁定比例"}
          >
            {imageAspectRatioLocked ? <Link2 size={16} /> : <Link2Off size={16} />}
          </button>

          {/* Height Input */}
          <div className="flex-1 flex items-center bg-zinc-100 rounded-xl px-3 py-2 transition-all dark:bg-[#252525]">
            <span className="text-zinc-400 text-xs font-medium mr-2 select-none dark:text-zinc-500">H</span>
            <input
              type="text"
              value={imageHeight || ''}
              disabled={!customSize}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="w-full bg-transparent outline-none text-right font-mono text-[13px] text-zinc-900 dark:text-white"
            />
          </div>

          <span className="text-zinc-500 text-xs font-semibold font-mono pr-1 select-none">PX</span>
        </div>
        </div>
        </div>
  );
};
