import React from 'react';
import { Box, Sparkles, Check, ShieldAlert, Search, X } from 'lucide-react';
import { cn } from '../MarkdownRenderer';
import { useAdaptiveDropdown } from '../../hooks/useAdaptiveDropdown';
import type { CreativeModelDefinition } from '../../creative-model-catalog';
import type { AgentLlmModel } from '../../creative-model-catalog/agentLlmModels';
import {
  groupModelsByVendor,
  modelMatchesSearch,
  modelParameterSummary,
  referencePriceLabel,
  referencePriceTooltip,
  vendorDisplayName,
  videoCapabilityChips,
} from '../../creative-model-catalog';

const ModelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 10.5L8.5 7L12 15L15.5 7L12 10.5Z" />
  </svg>
);

interface ModelDropdownProps {
  isAgent: boolean;
  agentAutoMatch: boolean;
  setAgentAutoMatch: (val: boolean) => void;
  agentModelTab: 'llm' | 'image' | 'video';
  setAgentModelTab: (tab: 'llm' | 'image' | 'video') => void;
  agentSelectedModels: string[];
  setAgentSelectedModels: (models: string[]) => void;
  /** Agent multi-select catalogs, sourced from the unified model catalog service. */
  agentImageModels: CreativeModelDefinition[];
  agentVideoModels: CreativeModelDefinition[];
  /** Language models the agent orchestration can use. */
  agentLlmModels: AgentLlmModel[];
  agentLlmModelsLoading: boolean;
  agentLlmModelId?: string;
  onSelectAgentLlmModel: (modelId: string) => void;
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  currentModels: CreativeModelDefinition[];
  currentModel?: CreativeModelDefinition;
  modelMenuPlacement: 'top' | 'bottom';
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  isVoice: boolean;
  isDigitalHuman?: boolean;
  isAction?: boolean;
}

const isSelectable = (model: CreativeModelDefinition) => model.lifecycle !== 'deprecated' && model.lifecycle !== 'retired';

export const ModelDropdown: React.FC<ModelDropdownProps> = ({
  isAgent,
  agentAutoMatch,
  setAgentAutoMatch,
  agentModelTab,
  setAgentModelTab,
  agentSelectedModels,
  setAgentSelectedModels,
  agentImageModels,
  agentVideoModels,
  agentLlmModels,
  agentLlmModelsLoading,
  agentLlmModelId,
  onSelectAgentLlmModel,
  selectedModelId,
  onSelectModel,
  currentModels,
  currentModel,
  modelMenuPlacement,
  dropdownRef,
  isVoice,
  isDigitalHuman = false,
  isAction = false
}) => {
  const agentTabModels = agentModelTab === 'llm'
    ? []
    : agentModelTab === 'image'
      ? agentImageModels
      : agentVideoModels;
  const modelGroups = groupModelsByVendor(currentModels);
  const [search, setSearch] = React.useState('');
  const normalizedSearch = search.trim().toLowerCase();
  const visibleGroups = normalizedSearch === ''
    ? modelGroups
    : modelGroups
        .map((group) => {
          const vendorMatches = group.vendorLabel.toLowerCase().includes(normalizedSearch);
          return {
            ...group,
            models: vendorMatches
              ? group.models
              : group.models.filter((model) => modelMatchesSearch(model, normalizedSearch)),
          };
        })
        .filter((group) => group.models.length > 0);
  const visibleAgentModels = normalizedSearch === ''
    ? agentTabModels
    : agentTabModels.filter((model) => modelMatchesSearch(model, normalizedSearch));
  const visibleAgentLlmModels = normalizedSearch === ''
    ? agentLlmModels
    : agentLlmModels.filter((model) => (
        [model.label, model.id, model.vendorLabel, model.desc]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      ));
  // The hook's placement is a first guess from a fixed dropdown height. The
  // real list can be much taller (or the input box can sit near the viewport
  // edge), so after mount measure the anchor and clamp the menu to the space
  // actually available on the chosen side. Without this the bottom of a long
  // model list is clipped and cannot be scrolled to.
  const { placement, maxHeight: menuMaxHeight } = useAdaptiveDropdown(
    dropdownRef,
    modelMenuPlacement,
    320,
  );
  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute right-0 bg-white rounded-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col w-[calc(100vw-32px)] max-w-[380px] sm:w-[380px] dark:bg-[#1e1e1e]",
        placement === 'top' ? "bottom-full mb-2" : "top-full mt-2",
        isAgent ? "sm:w-[420px] max-w-[420px]" : ""
      )}
      style={{ maxHeight: menuMaxHeight === null ? (isAgent ? '70vh' : '60vh') : `${menuMaxHeight}px` }}
    >
      {isAgent ? (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200">选择模型</span>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
              setAgentAutoMatch(!agentAutoMatch);
              if (!agentAutoMatch) {
                setAgentSelectedModels([
                  ...agentImageModels.filter(isSelectable).map(m => m.id),
                  ...agentVideoModels.filter(isSelectable).map(m => m.id),
                ]);
              }
            }}>
              <span className="text-[12px] text-zinc-500 dark:text-zinc-400">自动匹配模型</span>
                <div className={cn("w-8 h-4 rounded-full flex items-center px-[2px] transition-colors", agentAutoMatch ? "bg-[#165DFF] justify-end" : "bg-zinc-600 justify-start")}>
                  <div className="w-3.5 h-3.5 bg-white rounded-full"></div>
              </div>
              </div>
              </div>
          <div className="px-4 pb-2 shrink-0">
            <div className="grid grid-cols-3 gap-1 bg-zinc-100 rounded-xl p-1 dark:bg-[#2a2a2a]">
              {([
                ['llm', '语言模型'],
                ['image', '图片模型'],
                ['video', '视频模型'],
              ] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setAgentModelTab(tab)}
                  className={cn("py-1.5 text-[12px] font-medium rounded-lg transition-colors", agentModelTab === tab ? "bg-black/10 text-zinc-900 dark:bg-[#333333] dark:text-white" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200")}
                >
                  {label}
                </button>
              ))}
            </div>
            </div>
          <div className="px-4 py-1.5 text-[12px] text-zinc-500 shrink-0">
            {agentModelTab === 'llm' ? 'Agent 语言模型' : agentModelTab === 'image' ? '图片生成' : '视频生成'}
          </div>
          <div className="px-3 pb-2 shrink-0">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-2.5 py-1.5 dark:bg-[#2a2a2a]">
              <Search size={14} className="shrink-0 text-zinc-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={agentModelTab === 'llm' ? '搜索语言模型 / 厂商' : '搜索模型 / 厂商'}
                autoFocus
                className="w-full bg-transparent text-[12px] text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-200"
              />
              {search !== '' && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  aria-label="清除搜索"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {agentModelTab === 'llm' ? (
              visibleAgentLlmModels.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px] text-zinc-400">
                  {agentLlmModelsLoading ? '正在加载语言模型…' : '未找到匹配的语言模型'}
                </div>
              ) : visibleAgentLlmModels.map(model => {
                const isSelected = agentLlmModelId === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      setAgentAutoMatch(false);
                      onSelectAgentLlmModel(model.id);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-4 py-2 hover:bg-black/5 dark:hover:bg-[#2a2a2a] transition-colors text-left",
                      isSelected ? "bg-black/5 dark:bg-[#2f2f2f]" : ""
                    )}
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={cn("text-[13px] font-semibold leading-tight truncate", isSelected ? "text-zinc-900 dark:text-white" : "text-zinc-800 dark:text-zinc-200")}>
                        {model.label}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5 truncate">
                        {model.vendorLabel}
                      </span>
                    </div>
                    <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center shrink-0", isSelected ? "border-[#165DFF] bg-[#165DFF] text-white" : "border-zinc-400/60")}>
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })
            ) : (
              <>
                {visibleAgentModels.length === 0 && (
                  <div className="px-4 py-6 text-center text-[12px] text-zinc-400">未找到匹配的模型</div>
                )}
                {visibleAgentModels.map((model, index) => {
                  const isSelected = agentSelectedModels.includes(model.id);
                  const selectable = isSelectable(model);
                  const priceLabel = referencePriceLabel(model.referencePrices);
                  const chips = videoCapabilityChips(model.parameters?.video);
                  const summary = modelParameterSummary(model.parameters, model.modality);
                  const isNewestVersion = index === 0 && visibleAgentModels.length > 1 && selectable;
                  return (
                    <button
                      key={model.id}
                      disabled={!selectable}
                      onClick={() => {
                        if (!selectable) return;
                        setAgentAutoMatch(false);
                        if (isSelected) {
                          setAgentSelectedModels(agentSelectedModels.filter(id => id !== model.id));
                        } else {
                          setAgentSelectedModels([...agentSelectedModels, model.id]);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-4 py-2 hover:bg-black/5 dark:hover:bg-[#2a2a2a] transition-colors text-left",
                        isSelected ? "bg-black/5 dark:bg-[#2f2f2f]" : "",
                        !selectable && "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent"
                      )}
                    >
                      <div className={cn("shrink-0 w-6 h-6 rounded-md flex items-center justify-center", isSelected ? "bg-black/10 text-zinc-900 dark:bg-[#333333] dark:text-white" : "text-zinc-500 dark:text-zinc-400")}>
                        <ModelIcon />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {model.colorToken && (
                            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: model.colorToken }} />
                          )}
                          <span className={cn("text-[13px] font-semibold leading-tight", isSelected ? "text-zinc-900 dark:text-white" : "text-zinc-800 dark:text-zinc-200")}>
                            {model.label}
                          </span>
                          {isNewestVersion && (
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1 py-0.5 rounded scale-90 origin-left shrink-0">
                              最新
                            </span>
                          )}
                          {model.lifecycle === 'deprecated' && (
                            <span className="bg-amber-500/10 text-amber-500 text-[9px] font-bold px-1 py-0.5 rounded scale-90 origin-left shrink-0">
                              已弃用
                            </span>
                          )}
                          {chips.map((chip) => (
                            <span
                              key={chip}
                              className="border border-zinc-300/60 dark:border-zinc-600/60 text-zinc-500 dark:text-zinc-400 text-[9px] font-medium px-1 py-0.5 rounded scale-90 origin-left shrink-0"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                        {(summary || priceLabel) && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5 min-w-0">
                            {summary && <span className="truncate">{summary}</span>}
                            {summary && priceLabel && <span aria-hidden="true" className="shrink-0">·</span>}
                            {priceLabel && <span className="truncate">官方参考价 {priceLabel}</span>}
                          </div>
                        )}
                      </div>
                      <div className={cn("w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0", isSelected ? "border-[#165DFF] bg-[#165DFF] text-white" : "border-zinc-400/60")}>
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
          </div>
      ) : (
        <>
          <div className="px-4 py-2 text-zinc-500 dark:text-zinc-400 text-[12px] mb-1 shrink-0">
            选择模型: {currentModel?.label || ''} {isDigitalHuman
              ? 'by OmniHuman 1.5'
              : isAction
                ? 'by DreamActor M2.0'
                : vendorDisplayName(currentModel?.vendorCode)
                  ? `by ${vendorDisplayName(currentModel?.vendorCode)}`
                  : ''}
            {currentModel?.docsUrl && (
              <a
                href={currentModel.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-1.5 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                官方文档
              </a>
            )}
          </div>
          <div className="px-3 pb-2 shrink-0">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-2.5 py-1.5 dark:bg-[#2a2a2a]">
              <Search size={14} className="shrink-0 text-zinc-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索模型 / 厂商"
                autoFocus
                className="w-full bg-transparent text-[12px] text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-200"
              />
              {search !== '' && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  aria-label="清除搜索"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {visibleGroups.length === 0 && (
              <div className="px-4 py-6 text-center text-[12px] text-zinc-400">未找到匹配的模型</div>
            )}
            {visibleGroups.map((group) => (
              <div key={group.vendorCode}>
                {modelGroups.length > 1 && (
                  <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {group.vendorLabel}
                  </div>
                )}
                {group.models.map(model => {
                  const selectable = isSelectable(model);
                  const priceLabel = referencePriceLabel(model.referencePrices);
                  const priceTooltip = referencePriceTooltip(model.referencePrices);
                  const chips = videoCapabilityChips(model.parameters?.video);
                  const summary = modelParameterSummary(model.parameters, model.modality);
                  const replacement = model.lifecycle === 'deprecated'
                    ? model.replacementModelId
                    : undefined;
                  // The list is newest-first, so the first row of a vendor group is
                  // the newest version; mark it so the priority is visible.
                  const isNewestVersion = group.models[0]?.id === model.id
                    && group.models.length > 1
                    && selectable;
                  return (
                    <button
                      key={model.id}
                      disabled={!selectable}
                      onClick={() => {
                        if (!selectable) return;
                        onSelectModel(model.id);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-4 py-2 hover:bg-black/5 dark:hover:bg-[#2a2a2a] transition-colors text-left",
                        selectedModelId === model.id ? "bg-black/5 dark:bg-[#2f2f2f]" : "",
                        !selectable && "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent"
                      )}
                    >
                      {model.image ? (
                        <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden">
                          <img src={model.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        </div>
                      ) : model.badge ? (
                        <div className="shrink-0 w-8 h-8 flex flex-col items-center justify-center rounded-lg bg-[#0A1B3D] text-white relative select-none">
                          <div className="text-[11px] font-black tracking-tight leading-none">{model.badge}</div>
                          {model.subBadge && (
                            <div className="text-[6px] font-extrabold text-[#4080FF] tracking-wider mt-0.5 scale-90">{model.subBadge}</div>
                          )}
                        </div>
                      ) : (
                        <div className={cn("shrink-0 w-6 h-6 rounded-md flex items-center justify-center", selectedModelId === model.id ? "bg-black/10 text-zinc-900 dark:bg-[#333333] dark:text-white" : "text-zinc-500 dark:text-zinc-400")}>
                          <ModelIcon />
                        </div>
                      )}

                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {model.colorToken && (
                            <span
                              aria-hidden="true"
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: model.colorToken }}
                            />
                          )}
                          <span className={cn("text-[13px] font-semibold leading-tight", selectedModelId === model.id ? "text-zinc-900 dark:text-white" : "text-zinc-800 dark:text-zinc-200")}>
                            {model.label}
                          </span>
                          {model.spark && <Sparkles size={11} className="text-[#4080FF] fill-[#4080FF] shrink-0" />}
                          {isNewestVersion && (
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1 py-0.5 rounded scale-90 origin-left shrink-0">
                              最新
                            </span>
                          )}
                          {model.isNew && (
                            <span className="bg-[#165DFF]/10 text-[#4080FF] text-[9px] font-bold px-1 py-0.5 rounded scale-90 origin-left shrink-0">
                              New
                            </span>
                          )}
                          {model.lifecycle === 'deprecated' && (
                            <span className="bg-amber-500/10 text-amber-500 text-[9px] font-bold px-1 py-0.5 rounded scale-90 origin-left shrink-0 flex items-center gap-0.5">
                              <ShieldAlert size={9} strokeWidth={2.5} />
                              已弃用
                            </span>
                          )}
                          {chips.map((chip) => (
                            <span
                              key={chip}
                              className="border border-zinc-300/60 dark:border-zinc-600/60 text-zinc-500 dark:text-zinc-400 text-[9px] font-medium px-1 py-0.5 rounded scale-90 origin-left shrink-0"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                        {(summary || priceLabel || replacement) && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5 min-w-0">
                            {summary && <span className="truncate">{summary}</span>}
                            {summary && (priceLabel || replacement) && (
                              <span aria-hidden="true" className="shrink-0">·</span>
                            )}
                            {priceLabel && (
                              <span className="truncate" title={priceTooltip}>
                                官方参考价 {priceLabel}
                              </span>
                            )}
                            {!priceLabel && replacement && (
                              <span className="truncate">推荐改用 {replacement}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedModelId === model.id && <Check size={16} className="text-zinc-900 dark:text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
