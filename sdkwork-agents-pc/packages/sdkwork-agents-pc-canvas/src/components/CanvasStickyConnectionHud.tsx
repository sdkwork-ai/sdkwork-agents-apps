import React from 'react';

interface CanvasStickyConnectionHudProps {
  isVisible: boolean;
}

export const CanvasStickyConnectionHud: React.FC<CanvasStickyConnectionHudProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-[#101920]/95 text-[#4080FF] backdrop-blur-md px-4 py-2.5 rounded-full z-50 select-none animate-bounce flex items-center gap-2.5 text-xs font-bold font-sans">
      <span className="w-2 h-2 rounded-full bg-[#4080FF] animate-ping shrink-0" />
      <span>🔗 连线模式已开启 | 点击任意卡片即可一键连结</span>
        <div className="w-[1px] h-3.5 bg-[#4080FF]/25 mx-0.5" />
        <span className="text-[#4080FF]/70 text-[10px]">按 <kbd className="px-1.5 py-0.5 rounded bg-[#0A1B3D] text-[9px] text-[#4080FF] font-mono">Esc</kbd> 取消</span>
    </div>
  );
};
