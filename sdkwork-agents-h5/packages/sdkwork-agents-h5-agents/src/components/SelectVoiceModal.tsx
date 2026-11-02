import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Radio, Speaker, Headphones, User, Music, Search, Check, Play } from 'lucide-react';
import { cn } from '@sdkwork/agents-h5-commons';
import { voiceService, VoiceConfig } from '../services/VoiceService';
import { toast } from './Toast';

export interface SelectVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoices: string[];
  onSave: (voiceIds: string[], selectedItems: VoiceConfig[]) => void;
  isMulti?: boolean;
}

export const SelectVoiceModal: React.FC<SelectVoiceModalProps> = ({
  isOpen,
  onClose,
  selectedVoices,
  onSave,
  isMulti = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [voices, setVoices] = useState<VoiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionSnapshots, setSelectionSnapshots] = useState<Map<string, VoiceConfig>>(new Map());

  const [currentSelection, setCurrentSelection] = useState<string[]>([]);

  const loadVoices = useCallback(async (category: string, nextPage = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const catalog =
        category === 'custom'
          ? await voiceService.getMyVoices(nextPage)
          : await voiceService.getMarketVoices(nextPage);
      setVoices((prev) => (append ? [...prev, ...catalog.items] : catalog.items));
      setPage(catalog.page);
      setHasMore(catalog.hasMore);
    } catch (error) {
      console.error('Failed to load voices:', error);
      toast(
        error instanceof Error ? error.message : '无法加载声音目录，请检查 Voice SDK 配置',
        'error',
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    let cancelled = false;
    setCurrentSelection(selectedVoices);
    setSearchQuery('');
    const category = activeCategory === 'all' ? 'market' : activeCategory;
    void (async () => {
      setLoading(true);
      try {
        const catalog =
          category === 'custom'
            ? await voiceService.getMyVoices(1)
            : await voiceService.getMarketVoices(1);
        if (cancelled) {
          return;
        }
        setVoices(catalog.items);
        setPage(catalog.page);
        setHasMore(catalog.hasMore);
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error('Failed to load voices:', error);
        toast(
          error instanceof Error ? error.message : '无法加载声音目录，请检查 Voice SDK 配置',
          'error',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedVoices, activeCategory]);

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Mic': return <Mic size={24} />;
      case 'Radio': return <Radio size={24} />;
      case 'Speaker': return <Speaker size={24} />;
      case 'Headphones': return <Headphones size={24} />;
      case 'User': return <User size={24} />;
      default: return <Music size={24} />;
    }
  };

  const categories = [
    { id: 'all', name: '全部' },
    { id: 'market', name: '市场' },
    { id: 'custom', name: '克隆' },
  ];

  const handleSelect = (voice: VoiceConfig) => {
    setSelectionSnapshots((prev) => {
      const next = new Map(prev);
      next.set(voice.id, voice);
      return next;
    });
    if (isMulti) {
      setCurrentSelection(prev =>
        prev.includes(voice.id) ? prev.filter(v => v !== voice.id) : [...prev, voice.id]
      );
    } else {
      setCurrentSelection([voice.id]);
    }
  };

  const filteredVoices = voices.filter(v => {
    const matchesSearch = !searchQuery.trim() || 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (v.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || v.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
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
                <h2 className="text-xl font-bold text-[var(--color-text-primary,#0A1B3D)] mb-1">选择发音人</h2>
                <p className="text-xs text-[var(--color-text-secondary,#5B6B88)]">为你的智能体挑选合适的声音模型，支持多维度分类与专业克隆音色。</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--color-surface-strong,#DCE8F9)] text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-primary,#165DFF)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Sidebar */}
              <div className="w-[200px] bg-[var(--color-input-bg,#EAF1FB)] py-5 flex flex-col shrink-0">
                <div className="px-5 pb-5">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="搜索声音..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[var(--color-surface-color,#FFFFFF)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--color-text-primary,#0A1B3D)] outline-none transition-colors"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-icon-default,#5B6B88)]" size={16} />
                  </div>
                </div>
                <div className="px-4 space-y-1.5">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "w-full flex items-center px-4 py-3 rounded-xl text-[14px] font-medium transition-all text-left",
                        activeCategory === cat.id 
                          ? "bg-[var(--color-primary,#165DFF)]   box-border text-white  " 
                          : "text-[var(--color-text-secondary,#5B6B88)] hover:bg-[var(--color-surface-muted,#EAF1FB)] hover:text-[var(--color-text-primary,#0A1B3D)]"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[var(--color-surface-color,#FFFFFF)]">
                {loading ? (
                  <div className="text-[var(--color-text-secondary,#5B6B88)] text-sm text-center py-20 flex flex-col items-center justify-center gap-3">
                    <div className="ag-spinner ag-spinner-lg"></div>
                    正在同步声音模型市场...
                  </div>
                ) : filteredVoices.length === 0 ? (
                  <div className="text-[var(--color-text-secondary,#5B6B88)] text-sm text-center py-32 flex flex-col items-center justify-center">
                    <Music size={32} className="mb-4 text-[var(--color-icon-default,#5B6B88)] opacity-50" />
                    未找到符合条件的声音
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5 pb-20">
                    {filteredVoices.map(voice => {
                      const isSelected = currentSelection.includes(voice.id);
                      return (
                        <div
                          key={voice.id}
                          onClick={() => handleSelect(voice)}
                          className={cn(
                            "relative group bg-[var(--color-surface-muted,#EAF1FB)] rounded-xl  p-4 cursor-pointer transition-all hover:-translate-y-1",
                            isSelected 
                              ? "  " 
                              : "  hover:bg-[var(--color-surface-strong,#DCE8F9)]"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--color-primary,#165DFF)] rounded-full flex items-center justify-center text-white z-10">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                          
                          <div className="flex items-start gap-4">
                            <div className={cn("w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center text-white ", voice.color || 'bg-[var(--color-primary,#165DFF)]')}>
                              {getIcon(voice.iconName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className={cn("font-medium truncate", isSelected ? "text-[var(--color-primary,#165DFF)]" : "text-[var(--color-text-primary,#0A1B3D)] group-hover:text-[var(--color-text-primary,#0A1B3D)] transition-colors")}>
                                  {voice.name}
                                </h3>
                              </div>
                              <p className="text-[12px] text-[var(--color-text-secondary,#5B6B88)] line-clamp-2 leading-relaxed">
                                {voice.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary,#5B6B88)]">
                              <User size={12} />
                              <span>{voice.author || '我'}</span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (voice.audioPreview) {
                                  void new Audio(voice.audioPreview).play().catch(() => {
                                    toast('无法播放预览音频', 'error');
                                  });
                                  return;
                                }
                                toast('该音色暂无预览音频', 'info');
                              }}
                              className="w-7 h-7 rounded-full bg-[var(--color-input-bg,#EAF1FB)] flex items-center justify-center text-[var(--color-icon-default,#5B6B88)] hover:text-[var(--color-icon-on-primary,#FFFFFF)] hover:bg-[var(--color-primary,#165DFF)] transition-all"
                            >
                              <Play size={10} fill="currentColor" className="ml-0.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!loading && hasMore && (
                  <div className="flex justify-center pb-8">
                    <button
                      type="button"
                      onClick={() =>
                        void loadVoices(
                          activeCategory === 'all' ? 'market' : activeCategory,
                          page + 1,
                          true,
                        )
                      }
                      disabled={loadingMore}
                      className="px-4 py-2 rounded-lg text-sm bg-[var(--color-surface-muted,#EAF1FB)] hover:bg-[var(--color-surface-strong,#DCE8F9)] text-[var(--color-text-primary,#0A1B3D)] disabled:opacity-50"
                    >
                      {loadingMore ? '加载中...' : '加载更多'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[var(--color-surface-color,#FFFFFF)] flex items-center justify-between shrink-0">
              <div className="text-sm text-[var(--color-text-secondary,#5B6B88)]">
                已选择 <span className="text-[var(--color-primary,#165DFF)] font-semibold">{currentSelection.length}</span> 个声音
                {isMulti && <span className="ml-2 text-xs text-[var(--color-text-secondary,#5B6B88)]">(支持多选)</span>}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-[var(--color-text-primary,#0A1B3D)] hover:bg-[var(--color-surface-strong,#DCE8F9)] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const selectedItems = currentSelection
                      .map((id) => selectionSnapshots.get(id))
                      .filter((item): item is VoiceConfig => Boolean(item));
                    onSave(currentSelection, selectedItems);
                    onClose();
                  }}
                  className="px-6 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary,#165DFF)] hover:bg-[var(--color-primary-hover,#4080FF)] text-white transition-all"
                >
                  确认关联
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
