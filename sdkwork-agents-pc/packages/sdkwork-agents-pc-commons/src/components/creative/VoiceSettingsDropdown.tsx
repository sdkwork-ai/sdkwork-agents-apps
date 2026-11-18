import React, { useState } from 'react';
import { Mic, Search, Play, Pause, Check } from 'lucide-react';
import { cn } from '../MarkdownRenderer';
import { useAdaptiveDropdown } from '../../hooks/useAdaptiveDropdown';

export const VOICE_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'zh', label: '中文' },
  { id: 'en', label: '英文' },
  { id: 'multi', label: '多语种' },
  { id: 'dialect', label: '方言' }
];

/**
 * Fallback voices for a speech model whose vendor voice list is unknown (the
 * catalog publishes dynamic voice bindings for ElevenLabs / Seed TTS). A model
 * with a known vendor voice list renders that list instead.
 */
export const VOICE_OPTIONS = [
  { id: 'zh_male_1', name: '阳光青年', category: 'zh', tags: ['男声', '朝气', '清晰'], premium: true, duration: '0:05' },
  { id: 'zh_female_1', name: '温柔知性', category: 'zh', tags: ['女声', '播音', '抒情'], premium: false, duration: '0:06' },
  { id: 'zh_female_2', name: '活力少女', category: 'zh', tags: ['女声', '甜美', '二次元'], premium: true, duration: '0:04' },
  { id: 'zh_male_2', name: '浑厚男低音', category: 'zh', tags: ['男声', '沉稳', '解说'], premium: false, duration: '0:07' },
  { id: 'en_male_1', name: '沉稳大叔 (英)', category: 'en', tags: ['男声', '英音', '磁性'], premium: true, duration: '0:05' },
  { id: 'en_female_1', name: '知性女主 (英)', category: 'en', tags: ['女声', '美音', '新闻'], premium: false, duration: '0:05' },
  { id: 'multi_1', name: '全球通', category: 'multi', tags: ['多语种', '纪录片'], premium: true, duration: '0:08' },
  { id: 'dialect_1', name: '川渝幺妹', category: 'dialect', tags: ['女声', '四川话', '活泼'], premium: false, duration: '0:06' },
];

/** One vendor voice the selected speech model exposes. */
export interface VoiceSettingsVoiceOption {
  /** Vendor voice id submitted as `parameters.voice`. */
  id: string;
  label: string;
}

interface VoiceSettingsDropdownProps {
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  voiceSettingsPlacement: 'top' | 'bottom';
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  /** Vendor voices of the selected model; absent for unprofiled models. */
  voices?: readonly VoiceSettingsVoiceOption[];
}

export const VoiceSettingsDropdown: React.FC<VoiceSettingsDropdownProps> = ({
  selectedVoice,
  setSelectedVoice,
  voiceSettingsPlacement,
  dropdownRef,
  onClose,
  voices
}) => {
  const [activeVoiceCategory, setActiveVoiceCategory] = useState('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const offersVendorVoices = voices !== undefined && voices.length > 0;
  const vendorVoices = offersVendorVoices ? [...(voices ?? [])] : [];

  const filteredOptions = VOICE_OPTIONS.filter(v => {
    const matchesCategory = activeVoiceCategory === 'all' || v.category === activeVoiceCategory;
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const { placement, maxHeight } = useAdaptiveDropdown(dropdownRef, voiceSettingsPlacement, 360);

  if (offersVendorVoices) {
    return (
      <div
        ref={dropdownRef}
        className={cn(
          "absolute left-0 sm:left-[80px] w-[calc(100vw-32px)] sm:w-[380px] max-w-[380px] bg-white rounded-2xl z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col overflow-y-auto custom-scrollbar dark:bg-[#222222]",
          placement === 'top' ? "bottom-full mb-2" : "top-full mt-2"
        )}
        style={{ maxHeight: maxHeight === null ? '360px' : `${maxHeight}px` }}
      >
        <div className="p-3 pb-2 shrink-0 flex items-center justify-between px-4">
          <span className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200">选择音色</span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">由所选模型提供</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {vendorVoices.map(voice => (
            <button
              key={voice.id}
              onClick={() => {
                setSelectedVoice(voice.id);
                onClose();
              }}
              className={cn(
                "w-full flex items-center justify-between gap-3 p-3 rounded-xl transition-colors text-left",
                selectedVoice === voice.id ? "bg-[#165DFF]/10" : "hover:bg-black/5 dark:hover:bg-[#2a2a2a]"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-black/5 text-zinc-500 dark:bg-[#333333] dark:text-zinc-300">
                  <Mic size={16} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className={cn("text-[14px] font-medium truncate", selectedVoice === voice.id ? "text-[#4080FF]" : "text-zinc-800 dark:text-zinc-200")}>
                    {voice.label}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">{voice.id}</span>
                </div>
              </div>
              {selectedVoice === voice.id && (
                <div className="bg-[#165DFF] rounded-full p-1 shrink-0">
                  <Check size={12} className="text-white stroke-[3]" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute left-0 sm:left-[80px] w-[calc(100vw-32px)] sm:w-[420px] max-w-[420px] bg-white rounded-2xl z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col overflow-y-auto custom-scrollbar dark:bg-[#222222]",
        placement === 'top' ? "bottom-full mb-2" : "top-full mt-2"
      )}
      style={{ maxHeight: maxHeight === null ? '450px' : `${maxHeight}px` }}
    >
      {/* Header & Categories */}
      <div className="p-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200">选择音色</span>
            <button className="text-[12px] flex items-center gap-1 text-[#4080FF] hover:text-[#4080FF] transition-colors">
            <Mic size={12} /> 我的声音
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          {VOICE_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveVoiceCategory(category.id);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors",
                activeVoiceCategory === category.id
                ? "bg-[#165DFF]/10 text-[#4080FF]"
                : "bg-black/5 dark:bg-[#1a1a1a] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/10 dark:hover:bg-[#2a2a2a]"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
        </div>

      {/* Search Input */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative flex items-center w-full">
          <Search size={14} className="absolute left-3 text-zinc-500" />
          <input
            type="text"
            placeholder="搜索音色..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 bg-zinc-100 dark:bg-black/40 rounded-lg pl-8 pr-3 text-[13px] text-zinc-800 dark:text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
          />
        </div>
        </div>

      {/* Voice List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredOptions.map(voice => (
          <div
            key={voice.id}
            className={cn(
              "group flex flex-col gap-2 p-3 rounded-xl transition-colors cursor-pointer relative overflow-hidden",
              selectedVoice === voice.id ? "bg-[#165DFF]/10" : "hover:bg-black/5 dark:hover:bg-[#2a2a2a]"
            )}
            onClick={() => {
              setSelectedVoice(voice.id);
              onClose();
              setPlayingVoiceId(null);
            }}
          >
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex items-center gap-3">
                <button
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all",
                    playingVoiceId === voice.id
                    ? "bg-[#165DFF] text-white"
                    : "bg-[#333] text-zinc-300 group-hover:bg-[#165DFF]/20 group-hover:text-[#4080FF]"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlayingVoiceId(playingVoiceId === voice.id ? null : voice.id);
                  }}
                >
                  {playingVoiceId === voice.id ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current ml-0.5" />}
                </button>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[14px] font-medium", selectedVoice === voice.id ? "text-[#4080FF]" : "text-zinc-800 dark:text-zinc-200")}>
                      {voice.name}
                    </span>
                    {voice.premium && (
                      <span className="text-[10px] font-bold text-[#facc15] bg-[#facc15]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Pro
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-wrap items-center mt-1">
                    {voice.tags.map(tag => (
                      <span key={tag} className="text-[11px] text-zinc-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                  </div>
                  </div>
              <div className="flex flex-col items-end gap-2">
                {selectedVoice === voice.id && (
                  <div className="bg-[#165DFF] rounded-full p-1">
                     <Check size={12} className="text-white stroke-[3]" />
                  </div>
                )}
                <span className="text-[12px] font-mono text-zinc-600">
                   {voice.duration}
                </span>
              </div>
              </div>
              </div>
        ))}

        {filteredOptions.length === 0 && (
          <div className="py-10 flex flex-col items-center justify-center text-zinc-500 gap-2">
            <Mic size={24} className="opacity-50" />
            <span className="text-[13px]">暂无相关音色</span>
          </div>
        )}
      </div>
      </div>
  );
};
