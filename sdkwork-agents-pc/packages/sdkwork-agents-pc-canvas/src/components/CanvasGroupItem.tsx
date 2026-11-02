import React from 'react';
import { CanvasGroup } from '../types';
import { FolderDot, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@sdkwork/agents-pc-commons';

interface CanvasGroupItemProps {
  group: CanvasGroup;
  isSelected: boolean;
  onMouseDown: (groupId: string, e: React.MouseEvent) => void;
  onResizeMouseDown: (groupId: string, e: React.MouseEvent) => void;
  onTitleChange: (groupId: string, title: string) => void;
  onColorChange: (groupId: string, color: CanvasGroup['color']) => void;
  onDisband: (groupId: string) => void;
  onToggleCollapse: (groupId: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const colorSchemes = {
  cyan: {
    border: '',
    bg: 'bg-[#165DFF]/[0.02]',
    text: 'text-[#4080FF]',
    accent: 'bg-[#4080FF]',
    activeBorder: ''
  },
  yellow: {
    border: '',
    bg: 'bg-yellow-500/[0.02]',
    text: 'text-yellow-400',
    accent: 'bg-yellow-400',
    activeBorder: ''
  },
  pink: {
    border: '',
    bg: 'bg-pink-500/[0.02]',
    text: 'text-pink-400',
    accent: 'bg-pink-400',
    activeBorder: ''
  },
  emerald: {
    border: '',
    bg: 'bg-emerald-500/[0.02]',
    text: 'text-emerald-400',
    accent: 'bg-emerald-400',
    activeBorder: ''
  },
  violet: {
    border: '',
    bg: 'bg-violet-500/[0.02]',
    text: 'text-violet-400',
    accent: 'bg-violet-400',
    activeBorder: ''
  },
  orange: {
    border: '',
    bg: 'bg-orange-500/[0.02]',
    text: 'text-orange-400',
    accent: 'bg-orange-400',
    activeBorder: ''
  }
};

export const CanvasGroupItem: React.FC<CanvasGroupItemProps> = ({
  group,
  isSelected,
  onMouseDown,
  onResizeMouseDown,
  onTitleChange,
  onColorChange,
  onDisband,
  onToggleCollapse,
  onContextMenu
}) => {
  const scheme = colorSchemes[group.color || 'cyan'];

  const groupX = typeof group.x === 'number' && !isNaN(group.x) ? group.x : 0;
  const groupY = typeof group.y === 'number' && !isNaN(group.y) ? group.y : 0;
  const groupWidth = typeof group.width === 'number' && !isNaN(group.width) ? group.width : 240;
  const groupHeight = typeof group.height === 'number' && !isNaN(group.height) ? group.height : 180;

  return (
    <div
      onContextMenu={onContextMenu}
      style={{
        left: groupX,
        top: groupY,
        width: groupWidth,
        height: group.isCollapsed ? 40 : groupHeight,
        zIndex: 10
      }}
      onMouseDown={(e) => onMouseDown(group.id, e)}
      className={cn(
        "absolute rounded-[28px] transition-all duration-150 group/group pointer-events-auto",
        group.isCollapsed ? "bg-black/50" : "",
        isSelected ? scheme.activeBorder : scheme.border,
        scheme.bg
      )}
    >
      {/* Group Label / Inline editor */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-10 px-4 flex items-center justify-between bg-black/40 cursor-grab active:cursor-grabbing transition-all",
          group.isCollapsed ? "rounded-[28px]" : "rounded-t-[28px]"
        )}
      >
        <div className="flex items-center gap-2">
          {/* Toggle Expand/Collapse Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(group.id); }}
            className="p-1 -ml-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            title={group.isCollapsed ? "展开分组" : "折叠分组"}
          >
            {group.isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>

          <div className={cn("w-2 h-2 rounded-full", scheme.accent)} />
          <input
            type="text"
            value={group.title}
            onChange={(e) => onTitleChange(group.id, e.target.value)}
            className="bg-transparent text-[12px] font-extrabold text-zinc-100 outline-none p-0 focus:bg-white/5 rounded px-1.5 py-0.5 w-48 font-sans"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-[10px] text-zinc-500 font-mono font-medium">
            ({group.nodeIds.length} cards)
          </span>
        </div>

        <div className="flex items-center gap-2 opacity-30 group-hover/group:opacity-100 transition-opacity">
          {/* Color Palette selectors */}
          <div className="flex items-center gap-1 bg-[#121214] p-1 rounded-lg">
            {(['cyan', 'yellow', 'pink', 'emerald', 'violet', 'orange'] as const).map(color => (
              <button
                key={color}
                onClick={() => onColorChange(group.id, color)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full hover:scale-125 transition-transform cursor-pointer color-picker-dot",
                  color === 'cyan' && 'bg-[#4080FF]',
                  color === 'yellow' && 'bg-yellow-400',
                  color === 'pink' && 'bg-pink-400',
                  color === 'emerald' && 'bg-emerald-400',
                  color === 'violet' && 'bg-violet-400',
                  color === 'orange' && 'bg-orange-400',
                  group.color === color && 'ring-1 ring-white scale-110'
                )}
              />
            ))}
          </div>

          <div className="w-[1px] h-3 bg-white/10 mx-1" />

          <button
            onClick={(e) => { e.stopPropagation(); onDisband(group.id); }}
            className="text-[10px] text-zinc-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-2.5 py-0.5 rounded-md transition-colors font-bold"
            title="解散分组"
          >
            解散
          </button>
        </div>
        </div>

      {/* Empty group alert helper */}
      {!group.isCollapsed && group.nodeIds.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-zinc-600">
          <FolderDot size={24} className="opacity-40 mb-1.5" />
          <span className="text-[11px]">拖拽卡片至此即可自动加入</span>
        </div>
      )}

      {/* Resizer */}
      {!group.isCollapsed && (
        <div
          className="absolute -right-2 -bottom-2 w-5 h-5 bg-[#1e1e20] rounded-full cursor-nwse-resize opacity-0 group-hover/group:opacity-100 transition-opacity flex items-center justify-center z-50 hover:scale-110"
          onMouseDown={(e) => onResizeMouseDown(group.id, e)}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
        </div>
      )}
    </div>
  );
};

