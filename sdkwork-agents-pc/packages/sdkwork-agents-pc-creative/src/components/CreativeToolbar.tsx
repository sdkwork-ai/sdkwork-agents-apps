import React from 'react';
import { ChevronDown, SquarePen } from 'lucide-react';

interface CreativeToolbarProps {
  title: string;
}

export const CreativeToolbar: React.FC<CreativeToolbarProps> = ({ title }) => {
  return (
    <div className="h-14 flex items-center px-6 shrink-0 justify-between">
      <div className="text-[14px] font-medium text-[var(--ag-color-text-primary,#0A1B3D)] truncate max-w-[300px]">
        {title}
      </div>

      {/* Filter controls matching screenshot */}
      <div className="flex items-center gap-4 text-[12px] text-[var(--ag-color-text-secondary,#5B6B88)] font-medium select-none">
        <div className="flex items-center gap-1 hover:text-[var(--ag-color-text-primary,#0A1B3D)] cursor-pointer py-1 px-2 rounded-lg hover:bg-[var(--ag-color-surface-muted,#EAF1FB)] transition-colors">
          <span>时间</span>
          <ChevronDown size={13} className="text-[var(--ag-color-icon-default,#5B6B88)]" />
        </div>
        <div className="flex items-center gap-1 hover:text-[var(--ag-color-text-primary,#0A1B3D)] cursor-pointer py-1 px-2 rounded-lg hover:bg-[var(--ag-color-surface-muted,#EAF1FB)] transition-colors">
          <span>生成模式</span>
          <ChevronDown size={13} className="text-[var(--ag-color-icon-default,#5B6B88)]" />
        </div>
        <div className="flex items-center gap-1 hover:text-[var(--ag-color-text-primary,#0A1B3D)] cursor-pointer py-1 px-2 rounded-lg hover:bg-[var(--ag-color-surface-muted,#EAF1FB)] transition-colors">
          <span>操作类型</span>
          <ChevronDown size={13} className="text-[var(--ag-color-icon-default,#5B6B88)]" />
        </div>
        <div className="w-[1px] h-3.5 bg-[var(--ag-color-surface-strong,#DCE8F9)]" />
        <div className="flex items-center gap-1.5 text-[var(--ag-color-primary,#165DFF)] hover:text-[var(--ag-color-primary-hover,#4080FF)] cursor-pointer py-1 px-2 rounded-lg hover:bg-[var(--ag-color-primary-subtle,#E8F0FF)] transition-colors">
          <SquarePen size={12} className="text-[var(--ag-color-icon-active,#165DFF)]" />
          <span>自资库</span>
        </div>
      </div>
    </div>
  );
};
