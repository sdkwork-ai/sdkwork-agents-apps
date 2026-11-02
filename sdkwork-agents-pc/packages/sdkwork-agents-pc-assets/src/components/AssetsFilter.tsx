import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@sdkwork/agents-pc-commons';

interface AssetsFilterProps {
  activeFilter: 'image' | 'video' | 'audio' | 'document';
  setActiveFilter: (filter: 'image' | 'video' | 'audio' | 'document') => void;
}

export const AssetsFilter: React.FC<AssetsFilterProps> = ({ activeFilter, setActiveFilter }) => {
  return (
    <div className="flex items-center px-6 pb-4">
      <div className="flex items-center space-x-4 text-xs font-medium text-[var(--ag-color-text-secondary,#5B6B88)]">
        <button
          onClick={() => setActiveFilter('image')}
          className={cn(
            "transition-colors",
            activeFilter === 'image' ? "text-[var(--ag-color-primary,#165DFF)] font-semibold" : "hover:text-[var(--ag-color-text-primary,#0A1B3D)]",
          )}
        >
          图片
        </button>
        <button
          onClick={() => setActiveFilter('video')}
          className={cn(
            "transition-colors",
            activeFilter === 'video' ? "text-[var(--ag-color-primary,#165DFF)] font-semibold" : "hover:text-[var(--ag-color-text-primary,#0A1B3D)]",
          )}
        >
          视频
        </button>
        <button
          onClick={() => setActiveFilter('audio')}
          className={cn(
            "transition-colors",
            activeFilter === 'audio' ? "text-[var(--ag-color-primary,#165DFF)] font-semibold" : "hover:text-[var(--ag-color-text-primary,#0A1B3D)]",
          )}
        >
          音频
        </button>
        <button
          onClick={() => setActiveFilter('document')}
          className={cn(
            "transition-colors",
            activeFilter === 'document' ? "text-[var(--ag-color-primary,#165DFF)] font-semibold" : "hover:text-[var(--ag-color-text-primary,#0A1B3D)]",
          )}
        >
          文档
        </button>
          <div className="w-[1px] h-3 bg-[var(--ag-color-surface-strong,#DCE8F9)] mx-1" />
          <button className="flex items-center space-x-1 hover:text-[var(--ag-color-text-primary,#0A1B3D)] transition-colors">
          <span>筛选</span>
            <ChevronDown size={14} className="text-[var(--ag-color-icon-default,#5B6B88)]" />
        </button>
      </div>
      </div>
  );
};
