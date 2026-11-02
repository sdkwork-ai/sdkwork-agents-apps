import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Check, Layers } from 'lucide-react';
import { cn } from '@sdkwork/agents-h5-commons';
import { loadSkillCatalogPageByCategory } from '../services/SkillPresetCatalogService';

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  provider: string;
  icon: React.ReactNode;
  category: 'workflow' | 'preset';
}

export interface SelectSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSkillIds: string[];
  onSave: (skillIds: string[], selectedItems: SkillItem[]) => void;
}

export const SelectSkillsModal: React.FC<SelectSkillsModalProps> = ({
  isOpen,
  onClose,
  selectedSkillIds,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'preset'>('workflow');
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentSelection, setCurrentSelection] = useState<string[]>([]);
  const [selectionSnapshots, setSelectionSnapshots] = useState<Map<string, SkillItem>>(new Map());

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const loadSkills = useCallback(async (
    category: SkillItem['category'],
    nextPage = 1,
    append = false,
    q = '',
  ) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const catalog = await loadSkillCatalogPageByCategory(category, nextPage, undefined, q || undefined);
      setSkills((prev) => (append ? [...prev, ...catalog.items] : catalog.items));
      setPage(catalog.page);
      setHasMore(catalog.hasMore);
    } catch (loadError) {
      console.error('Failed to load skills catalog:', loadError);
      setError(
        loadError instanceof Error ? loadError.message : '无法加载技能目录，请检查 Skills SDK 配置',
      );
      if (!append) {
        setSkills([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setCurrentSelection(selectedSkillIds);
    setSearchQuery('');
    setDebouncedQuery('');
    setActiveTab('workflow');
  }, [isOpen, selectedSkillIds]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void loadSkills(activeTab, 1, false, debouncedQuery);
  }, [activeTab, debouncedQuery, isOpen, loadSkills]);

  const handleSelect = (item: SkillItem) => {
    setSelectionSnapshots((prev) => {
      const next = new Map(prev);
      next.set(item.id, item);
      return next;
    });
    setCurrentSelection(prev =>
      prev.includes(item.id) ? prev.filter(v => v !== item.id) : [...prev, item.id]
    );
  };

  const visibleItems = skills.filter((item) => item.category === activeTab);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--color-scrim,rgba(10,27,61,0.45))] z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1024px] h-[720px] bg-[var(--color-surface-color,#FFFFFF)] rounded-2xl flex flex-col z-[101] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 bg-[var(--color-surface-color,#FFFFFF)] shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary,#0A1B3D)] mb-1">选择 Agent Skills</h2>
                <p className="text-xs text-[var(--color-text-secondary,#5B6B88)]">赋予智能体更高级的推理、反思和多维度协作能力。</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--color-surface-strong,#DCE8F9)] text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-primary,#165DFF)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              <div className="w-[200px] bg-[var(--color-input-bg,#EAF1FB)] py-5 flex flex-col shrink-0">
                <div className="px-5 pb-5">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="搜索心智..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[var(--color-surface-color,#FFFFFF)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--color-text-primary,#0A1B3D)] outline-none transition-colors"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-icon-default,#5B6B88)]" size={16} />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-6">
                  <div>
                    <h3 className="text-[11px] font-semibold text-[var(--color-text-secondary,#5B6B88)] uppercase tracking-wider mb-2 px-4">技能类型</h3>
                    <div className="space-y-1.5">
                      {[
                        { id: 'workflow' as const, name: '心智与工作流' },
                        { id: 'preset' as const, name: '角色预设' },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all text-left group",
                            activeTab === tab.id
                              ? "bg-[var(--color-primary-subtle,#E8F0FF)] text-[var(--color-primary,#165DFF)]"
                              : "text-[var(--color-text-secondary,#5B6B88)] hover:bg-[var(--color-surface-muted,#EAF1FB)] hover:text-[var(--color-text-primary,#0A1B3D)]"
                          )}
                        >
                          {tab.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[var(--color-surface-color,#FFFFFF)]">
                {loading ? (
                  <div className="text-[var(--color-text-secondary,#5B6B88)] text-sm text-center py-32 flex flex-col items-center justify-center gap-3">
                    <div className="ag-spinner ag-spinner-lg" />
                    正在加载技能目录...
                  </div>
                ) : error ? (
                  <div className="text-center py-32 flex flex-col items-center justify-center gap-4">
                    <p className="text-sm text-[var(--color-danger,#F53F3F)] max-w-md">{error}</p>
                    <button
                      type="button"
                      onClick={() => void loadSkills(activeTab, 1, false, debouncedQuery)}
                      className="px-4 py-2 rounded-xl text-sm bg-[var(--color-surface-muted,#EAF1FB)] hover:bg-[var(--color-surface-strong,#DCE8F9)] text-[var(--color-text-primary,#0A1B3D)]"
                    >
                      重试
                    </button>
                  </div>
                ) : visibleItems.length === 0 ? (
                  <div className="text-[var(--color-text-secondary,#5B6B88)] text-sm text-center py-32 flex flex-col items-center justify-center">
                    <Layers size={32} className="mb-4 text-[var(--color-icon-default,#5B6B88)] opacity-50" />
                    没有找到匹配的项
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-20">
                    {visibleItems.map(item => {
                      const isSelected = currentSelection.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "relative group bg-[var(--color-surface-muted,#EAF1FB)] rounded-xl  p-5 cursor-pointer transition-all hover:-translate-y-1 flex flex-col",
                            isSelected
                              ? "   bg-[var(--color-primary-subtle,#E8F0FF)]"
                              : "  hover:bg-[var(--color-surface-strong,#DCE8F9)]"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-4 right-4 text-[var(--color-primary,#165DFF)]">
                              <Check size={18} strokeWidth={3} />
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-color,#FFFFFF)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <h3 className={cn("text-[15px] font-semibold truncate", isSelected ? "text-[var(--color-primary,#165DFF)]" : "text-[var(--color-text-primary,#0A1B3D)] group-hover:text-[var(--color-text-primary,#0A1B3D)] transition-colors")}>
                                {item.name}
                              </h3>
                              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-muted,#EAF1FB)] text-[var(--color-text-secondary,#5B6B88)]">
                                {item.provider}
                              </span>
                            </div>
                          </div>

                          <p className="text-[13px] text-[var(--color-text-secondary,#5B6B88)] leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!loading && !error && hasMore && (
                  <div className="flex justify-center pb-6">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => void loadSkills(activeTab, page + 1, true, debouncedQuery)}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-surface-muted,#EAF1FB)] hover:bg-[var(--color-surface-strong,#DCE8F9)] text-[var(--color-text-primary,#0A1B3D)] transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? '加载中...' : '加载更多'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-[var(--color-surface-color,#FFFFFF)] flex items-center justify-between shrink-0">
              <div className="text-sm text-[var(--color-text-secondary,#5B6B88)]">
                已启用 <span className="text-[var(--color-primary,#165DFF)] font-semibold">{currentSelection.length}</span> 项技能
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-primary,#0A1B3D)] hover:bg-[var(--color-surface-strong,#DCE8F9)] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const selectedItems = currentSelection
                      .map((id) => selectionSnapshots.get(id))
                      .filter((item): item is SkillItem => Boolean(item));
                    onSave(currentSelection, selectedItems);
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-primary,#165DFF)] hover:bg-[var(--color-primary-hover,#4080FF)] text-white transition-all"
                >
                  确认启用
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
