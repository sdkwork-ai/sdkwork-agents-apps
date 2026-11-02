import React from 'react';
import { Search, Plus } from 'lucide-react';
import { cn } from '@sdkwork/agents-pc-commons';

interface InspirationTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const InspirationTabs: React.FC<InspirationTabsProps> = ({
activeTab,
setActiveTab,
searchQuery,
setSearchQuery
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-1 bg-[var(--ag-color-surface-muted,#EAF1FB)] rounded-xl p-1">
          {['发现', '技能', '短片', '活动'].map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchQuery('');
              }}
                className={cn(
                "px-5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors whitespace-nowrap",
                activeTab === tab
                  ? "bg-white text-[var(--ag-color-primary,#165DFF)]"
                  : "text-[var(--ag-color-text-secondary,#5B6B88)] hover:text-[var(--ag-color-text-primary,#0A1B3D)]"
              )}
              >
                {tab}
              </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ag-color-icon-default,#5B6B88)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === '技能' ? '搜索实用创意技能' : activeTab === '活动' ? '搜索热门大赛' : '童话世界'}
            className="bg-[var(--ag-color-surface-muted,#EAF1FB)] rounded-full pl-9 pr-4 py-1.5 text-[13px] text-[var(--ag-color-text-primary,#0A1B3D)] placeholder-[var(--ag-color-text-tertiary,#8A97AD)] focus:outline-none w-[220px] transition-colors"
          />
        </div>
      </div>

      {/* "+ 发布短片" Button shown ONLY under Short Video (短片) Tab */}
      {activeTab === '短片' && (
          <button className="flex items-center gap-1.5 bg-[var(--ag-color-primary,#165DFF)] hover:bg-[var(--ag-color-primary-hover,#4080FF)] text-white rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors shrink-0">
            <Plus size={15} />
              发布短片
          </button>
      )}
    </div>
  );
};
