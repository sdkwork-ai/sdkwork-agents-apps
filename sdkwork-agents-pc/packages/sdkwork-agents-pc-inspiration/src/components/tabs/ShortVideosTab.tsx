import React from 'react';
import { Play, Heart } from 'lucide-react';
import type { ShortVideo } from '../../types';

interface ShortVideosTabProps {
  filteredVideos: ShortVideo[];
  onPlayVideo: (video: ShortVideo) => void;
}

export const ShortVideosTab: React.FC<ShortVideosTabProps> = ({ filteredVideos, onPlayVideo }) => {
  return (
    <div>
      {filteredVideos.length === 0 ? (
            <div className="text-center py-20 text-[var(--ag-color-text-tertiary,#8A97AD)] text-sm">
              没有找到符合条件的短片作品
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {filteredVideos.map(video => (
                  <div
                    key={video.id}
                    className="flex flex-col group cursor-pointer"
                    onClick={() => onPlayVideo(video)}
                  >
                    {/* Video Poster */}
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[var(--ag-color-surface-strong,#DCE8F9)]">
                      <img
                        src={video.cover}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                      {/* Flat scrim overlay on hover */}
                      <div className="absolute inset-0 bg-[var(--ag-color-scrim,rgba(10,27,61,0.45))] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Play Icon Overlay on Hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-12 h-12 rounded-full bg-[var(--ag-color-primary,#165DFF)] text-white flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>

                      {/* Top-Right Info Overlay (likes, etc) */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-semibold text-white bg-[#0A1B3D]/70 px-2 py-0.5 rounded-full">
                        <img src={video.avatar} className="w-3.5 h-3.5 rounded-full object-cover" />
                        <span className="max-w-[70px] truncate">{video.author}</span>
                      </div>

                      {/* Video Metadata overlays (duration) */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-2.5 text-[11px] font-mono font-medium text-white bg-[#0A1B3D]/70 px-2 py-0.5 rounded-full">
                        <div className="flex items-center gap-1">
                          <Heart size={11} fill="currentColor" className="text-red-400" />
                          <span>{video.likes}</span>
                        </div>
                        <span>{video.duration}</span>
                      </div>
                    </div>

                    {/* Video Title and Description */}
                    <div className="mt-3.5 px-0.5">
                      <h3 className="text-[13px] font-bold text-[var(--ag-color-text-primary,#0A1B3D)] line-clamp-1 group-hover:text-[var(--ag-color-primary,#165DFF)] transition-colors leading-tight">
                        {video.title}
                      </h3>
                      <p className="text-[11.5px] text-[var(--ag-color-text-secondary,#5B6B88)] mt-1.5 line-clamp-2 leading-relaxed">
                        {video.desc}
                      </p>
                    </div>
                  </div>
              ))}
            </div>
      )}
    </div>
  );
};
