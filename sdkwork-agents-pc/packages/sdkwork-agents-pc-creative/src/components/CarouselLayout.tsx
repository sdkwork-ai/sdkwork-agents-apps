import React from 'react';
import { Play } from 'lucide-react';
import { cn } from '@sdkwork/agents-pc-commons';
import { CreativeMessage } from '../types';

interface CarouselLayoutProps {
  message: CreativeMessage;
  activeIdx: number;
  onSetCarouselIndex: (index: number) => void;
  onPreviewImage: (message: CreativeMessage, index: number) => void;
}

export const CarouselLayout: React.FC<CarouselLayoutProps> = ({ message, activeIdx, onSetCarouselIndex, onPreviewImage }) => {
  const imageUrls = message.imageUrls;
  const isVideo = message.mode === 'video';

  return (
    <div className="flex flex-col gap-3" id="carousel-layout">
      <div className="relative aspect-[16/9] w-full max-h-[380px] bg-white rounded-2xl overflow-hidden group/card dark:bg-[#1a1a1c]">
        <img
          src={imageUrls?.[activeIdx]}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[#0A1B3D]/45" />

        {/* Video Play Overlay */}
        {isVideo && (
          <div
            onClick={() => onPreviewImage(message, activeIdx)}
            className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/25 transition-colors cursor-pointer z-10"
          >
            <div className="w-16 h-16 rounded-full bg-[#165DFF] text-white flex items-center justify-center transform scale-95 hover:scale-105 transition-transform duration-300">
              <Play size={24} fill="currentColor" className="ml-1" />
            </div>
            </div>
        )}

        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg select-none z-20">
          {isVideo ? '创意视频' : '创意图'} { activeIdx + 1 } / {imageUrls?.length || 4}
        </div>
        <button
          onClick={() => onPreviewImage(message, activeIdx)}
          className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-[#4080FF] hover:text-[#4080FF] px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer z-20"
        >
          {isVideo ? '播放视频' : '全屏查看'}
        </button>
      </div>

      {/* Thumbnail Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 select-none">
        {imageUrls?.map((url, idx) => (
          <button
            key={idx}
            onClick={() => onSetCarouselIndex(idx)}
            className={cn(
              "relative w-20 h-14 rounded-lg overflow-hidden transition-all shrink-0 cursor-pointer",
              activeIdx === idx ? "ring-2 ring-[#4080FF]/20 scale-95" : "opacity-70 hover:opacity-100"
            )}
          >
            <img src={url} className="absolute inset-0 w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
            {isVideo && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play size={12} fill="currentColor" className="text-white/80" />
              </div>
            )}
          </button>
        ))}
      </div>
      </div>
  );
};
