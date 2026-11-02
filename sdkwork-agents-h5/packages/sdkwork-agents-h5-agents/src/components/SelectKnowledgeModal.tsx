import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Check, Database, FileText, Clock } from 'lucide-react';
import { cn } from '@sdkwork/agents-h5-commons';
import { knowledgeSelectionService, type KnowledgeBase } from '../services/KnowledgeSelectionService';

export interface SelectKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKbIds: string[];
  onSave: (kbIds: string[], selectedItems: KnowledgeBase[]) => void;
}

export const SelectKnowledgeModal: React.FC<SelectKnowledgeModalProps> = ({
  isOpen,
  onClose,
  selectedKbIds,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'team'>('all');
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSelection, setCurrentSelection] = useState<string[]>([]);

  const loadKbs = useCallback(async (cursor?: string, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const page = await knowledgeSelectionService.getBasesPage(cursor);
      setKbs((prev) => (append ? [...prev, ...page.items] : page.items));
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (loadError) {
      console.error('Failed to load knowledge bases:', loadError);
      setError(
        loadError instanceof Error ? loadError.message : '无法加载知识库列表，请检查 Knowledgebase SDK 配置',
      );
      if (!append) {
        setKbs([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentSelection(selectedKbIds);
      setSearchQuery('');
      setActiveTab('all');
      void loadKbs(undefined, false);
    }
  }, [isOpen, selectedKbIds, loadKbs]);

  const handleSelect = (id: string) => {
    setCurrentSelection(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const filteredKbs = kbs.filter(kb => {
    const matchesSearch = !searchQuery.trim() || 
      kb.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (kb.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || kb.type === activeTab;
    return matchesSearch && matchesTab;
  });

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
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-[var(--color-surface-color,#FFFFFF)] shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary,#0A1B3D)] mb-1">关联知识库</h2>
                <p className="text-xs text-[var(--color-text-secondary,#5B6B88)]">选择要挂载到智能体的结构化语料，增强其生成质量和事实准确性。</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--color-surface-strong,#DCE8F9)] text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-primary,#165DFF)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Sidebar: Tabs */}
              <div className="w-[180px] bg-[var(--color-input-bg,#EAF1FB)] py-5 flex flex-col shrink-0">
                <div className="px-4 space-y-1.5 flex-1">
                  {[
                    { id: 'all', name: '全部空间' },
                    { id: 'personal', name: '个人知识库' },
                    { id: 'team', name: '团队知识库' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "w-full flex items-center px-4 py-3 rounded-xl text-[14px] font-medium transition-all text-left",
                        activeTab === tab.id 
                          ? "bg-[var(--color-primary-subtle,#E8F0FF)]   text-[var(--color-primary,#165DFF)] " 
                          : "text-[var(--color-text-secondary,#5B6B88)] hover:bg-[var(--color-surface-muted,#EAF1FB)] hover:text-[var(--color-text-primary,#0A1B3D)]"
                      )}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Object List */}
              <div className="flex-1 flex flex-col bg-[var(--color-surface-color,#FFFFFF)] min-w-0">
                <div className="p-6 pb-4 shrink-0 flex items-center justify-between">
                  <div className="relative w-72">
                    <input 
                      type="text" 
                      placeholder="搜索知识库名称或描述..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[var(--color-surface-color,#FFFFFF)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--color-text-primary,#0A1B3D)] outline-none transition-colors"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-icon-default,#5B6B88)]" size={16} />
                  </div>
                  <div className="text-[13px] text-[var(--color-text-secondary,#5B6B88)] font-medium">
                    共 {filteredKbs.length} 个项目
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {loading ? (
                    <div className="text-[var(--color-text-secondary,#5B6B88)] text-sm text-center py-20 flex flex-col items-center justify-center gap-3">
                      <div className="ag-spinner ag-spinner-lg"></div>
                      正在加载知识库列表...
                    </div>
                  ) : error ? (
                    <div className="text-[var(--color-text-secondary,#5B6B88)] text-sm text-center py-20 flex flex-col items-center justify-center gap-4">
                      <p>{error}</p>
                      <button
                        type="button"
                        onClick={() => void loadKbs(undefined, false)}
                        className="px-4 py-2 rounded-lg bg-[var(--color-primary-subtle,#E8F0FF)] text-[var(--color-primary,#165DFF)] hover:bg-[var(--color-primary-hover,#4080FF)]/30 transition-colors"
                      >
                        重试
                      </button>
                    </div>
                  ) : filteredKbs.length === 0 ? (
                    <div className="text-[var(--color-text-secondary,#5B6B88)] text-sm text-center py-32 flex flex-col items-center justify-center">
                      <Database size={32} className="mb-4 text-[var(--color-icon-default,#5B6B88)] opacity-50" />
                      未找到符合条件的知识库
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-20">
                      {filteredKbs.map(kb => {
                        const isSelected = currentSelection.includes(kb.id);
                        return (
                          <div
                            key={kb.id}
                            onClick={() => handleSelect(kb.id)}
                            className={cn(
                              "relative group bg-[var(--color-surface-muted,#EAF1FB)] rounded-xl  p-5 cursor-pointer transition-all hover:-translate-y-1 flex flex-col h-full",
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
                            
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-strong,#DCE8F9)] flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                                {kb.logo}
                              </div>
                              <div className="flex-1 min-w-0 pr-6">
                                <h3 className={cn("text-base font-semibold mb-1 truncate", isSelected ? "text-[var(--color-primary,#165DFF)]" : "text-[var(--color-text-primary,#0A1B3D)] group-hover:text-[var(--color-text-primary,#0A1B3D)] transition-colors")}>
                                  {kb.name}
                                </h3>
                                <div className="text-xs text-[var(--color-text-secondary,#5B6B88)] flex items-center gap-1.5 flex-wrap">
                                  <span className={cn("px-1.5 py-0.5 rounded uppercase tracking-wider text-[10px]", kb.type === 'team' ? 'bg-[var(--color-success,#00B42A)]/10 text-[var(--color-success,#00B42A)]' : 'bg-[var(--color-primary-subtle,#E8F0FF)] text-[var(--color-primary,#165DFF)]')}>
                                    {kb.type}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-[13px] text-[var(--color-text-secondary,#5B6B88)] leading-relaxed mb-4 flex-1 line-clamp-2">
                              {kb.description || '暂无描述'}
                            </p>
                            
                            <div className="mt-auto pt-3 flex items-center justify-between text-xs text-[var(--color-text-secondary,#5B6B88)]">
                              <div className="flex items-center gap-1.5">
                                <FileText size={14} /> {kb.count} 篇文档
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock size={14} /> {kb.updatedAt ? new Date(kb.updatedAt).toLocaleDateString() : '-'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!loading && hasMore && (
                    <div className="flex justify-center pb-6">
                      <button
                        type="button"
                        disabled={loadingMore}
                        onClick={() => void loadKbs(nextCursor, true)}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-surface-muted,#EAF1FB)] hover:bg-[var(--color-surface-strong,#DCE8F9)] text-[var(--color-text-primary,#0A1B3D)] transition-colors disabled:opacity-50"
                      >
                        {loadingMore ? '加载中...' : '加载更多'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 bg-[var(--color-surface-color,#FFFFFF)] flex items-center justify-between shrink-0">
              <div className="text-sm text-[var(--color-text-secondary,#5B6B88)]">
                已选中 <span className="text-[var(--color-primary,#165DFF)] font-semibold">{currentSelection.length}</span> 个知识库
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
                    const selectedItems = kbs.filter((kb) => currentSelection.includes(kb.id));
                    onSave(currentSelection, selectedItems);
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-primary,#165DFF)] hover:bg-[var(--color-primary-hover,#4080FF)] text-white transition-all font-semibold"
                >
                  确认挂载
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
