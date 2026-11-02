import type { LucideIcon } from 'lucide-react';
import {
Bot,
Folder,
Gem,
Home,
LayoutGrid,
MessageSquare,
Sparkles,
} from 'lucide-react';
import type { FC } from 'react';
import { cn } from '@sdkwork/agents-pc-commons';
import { SIDEBAR_TABS, type SidebarTab, type WorkbenchTab } from './workbenchTabs';

export type { WorkbenchTab } from './workbenchTabs';

interface GlobalSidebarProps {
  activeTab: WorkbenchTab;
  avatarBg: string;
  /** Tabs hidden by the embedding host (e.g. surfaces with no backend yet). */
  hiddenTabs?: readonly WorkbenchTab[];
  isTokenPlanOpen: boolean;
  onOpenTokenPlan: () => void;
  setActiveTab: (tab: WorkbenchTab) => void;
  showSidebarLogo: boolean;
  username: string;
}

interface SidebarItem {
  icon?: LucideIcon;
  id: SidebarTab;
  label: string;
}

const SIDEBAR_ITEM_BY_TAB: Record<SidebarTab, Omit<SidebarItem, 'id'>> = {
  agents: { icon: Bot, label: 'Agent' },
  chat_session: { icon: MessageSquare, label: '对话' },
  inspiration: { icon: Home, label: '灵感' },
  creative: { icon: Sparkles, label: '生成' },
  assets: { icon: Folder, label: '资产' },
  canvas: { icon: LayoutGrid, label: '画布' },
};

const SIDEBAR_ITEMS: SidebarItem[] = SIDEBAR_TABS.map((id) => ({
    id,
    ...SIDEBAR_ITEM_BY_TAB[id],
}));

export const GlobalSidebar: FC<GlobalSidebarProps> = ({
activeTab,
avatarBg,
hiddenTabs = [],
isTokenPlanOpen,
onOpenTokenPlan,
setActiveTab,
showSidebarLogo,
username,
}) => {
  const visibleItems = SIDEBAR_ITEMS.filter((item) => !hiddenTabs.includes(item.id));
  return (
    <div className="relative z-50 flex h-full w-[68px] shrink-0 flex-col items-center bg-[var(--ag-color-rail,#0A1B3D)] py-4">
      {showSidebarLogo && (
          <div className="mb-6 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--ag-color-primary,#165DFF)]">
            <Sparkles className="fill-[var(--ag-color-icon-on-primary,#FFFFFF)] text-[var(--ag-color-icon-on-primary,#FFFFFF)]" size={16} />
          </div>
      )}

      <nav aria-label="工作区" className="flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto px-2">
        {visibleItems.map(({ id, icon: Icon, label }) => {
            const active = activeTab === id;
            return (
              <button
                aria-current={active ? 'page' : undefined}
                className={cn(
                'group relative flex w-full flex-col items-center justify-center rounded-xl py-3 transition-colors duration-[var(--ag-motion-duration-fast)]',
                active
                  ? 'bg-[var(--ag-color-rail-active,#165DFF)] text-white'
                : 'text-[var(--ag-color-rail-text-muted,#7F91B0)] hover:bg-white/[0.06] hover:text-[var(--ag-color-rail-text,#C9D6EA)]',
              )}
                key={id}
                onClick={() => setActiveTab(id)}
                type="button"
              >
                {Icon ? (
                      <Icon
                        className="text-[var(--ag-color-icon-on-rail,#C9D6EA)] transition-colors duration-[var(--ag-motion-duration-fast)]"
                        fill={active ? 'currentColor' : 'none'}
                        size={20}
                      />
                    ) : (
                      <span aria-hidden="true" className="h-5 w-5" />
                )}
                <span className="mt-1.5 text-[10px] font-medium tracking-wide">{label}</span>
                {active && <div aria-hidden="true" className="absolute bottom-[30%] left-0 top-[30%] w-[3px] bg-white/80" />}
              </button>
            );
        })}
      </nav>

      <div className="mt-auto flex w-full flex-col items-center gap-3 px-2">
        <button
          aria-current={isTokenPlanOpen ? 'page' : undefined}
          className={cn(
          'group relative flex w-full flex-col items-center justify-center rounded-xl py-2 text-[var(--ag-color-rail-text,#C9D6EA)] transition-colors',
          isTokenPlanOpen
            ? 'bg-[var(--ag-color-rail-active,#165DFF)] text-white'
          : 'hover:bg-white/[0.06] hover:text-white',
        )}
          onClick={onOpenTokenPlan}
          type="button"
        >
          <Gem className="mb-1 text-[var(--ag-color-icon-on-rail,#C9D6EA)]" fill={isTokenPlanOpen ? 'currentColor' : 'none'} size={16} />
          <span className="text-[9px]">开会员</span>
          {isTokenPlanOpen && <div aria-hidden="true" className="absolute bottom-[25%] left-0 top-[25%] w-[3px] bg-white/80" />}
        </button>

        <button className="group relative my-2" type="button">
          <div className={cn('flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xs font-bold transition-colors', avatarBg)}>
            {username.substring(0, 2).toUpperCase()}
          </div>
          <div className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--ag-color-primary,#165DFF)] text-[8px] font-bold text-[var(--ag-color-icon-on-primary,#FFFFFF)] ring-2 ring-[var(--ag-color-rail,#0A1B3D)]">1</div>
        </button>
      </div>
    </div>
  );
};
