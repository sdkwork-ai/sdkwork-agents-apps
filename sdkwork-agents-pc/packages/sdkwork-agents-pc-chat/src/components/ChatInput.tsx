import React, { useEffect, useState, useRef } from 'react';
import { Paperclip, Send, Loader2, X, Square, Plus, Mic, AudioLines, ArrowUp, ImageIcon, Globe, Telescope, Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PlusMenuPopup } from './PlusMenuPopup';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  selectedImages: string[];
  isGenerating: boolean;
  inputDisabled?: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: (index: number) => void;
  handleSend: () => void;
  handleStop?: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  selectedImages,
  isGenerating,
  inputDisabled = false,
  textareaRef,
  fileInputRef,
  handleFileChange,
  handleRemoveImage,
  handleSend,
  handleStop,
  handleKeyDown
}) => {
  const { t } = useTranslation('chat');
  type InputMode = 'image' | 'search' | 'research' | null;
  const [showMenu, setShowMenu] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleKeyDownWithMode = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && input === '') {
      setInputMode(null);
    }
    handleKeyDown(e);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
      textareaRef.current.style.overflowY = scrollHeight > 200 ? 'auto' : 'hidden';
    }
  }, [input, textareaRef]);

  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-[var(--ag-color-background,#F4F7FC)] dark:bg-[#191919] pt-20 z-10 pointer-events-none">
      <div className="max-w-4xl mx-auto w-full bg-[var(--ag-color-surface-muted,#EAF1FB)] dark:bg-[#2f2f2f] rounded-2xl relative transition-colors pointer-events-auto">
        <div className="relative flex flex-col focus-within:ring-0 transition-shadow">

          {/* Plus Menu Popup */}
          {showMenu && (
            <PlusMenuPopup
              menuRef={menuRef}
              setShowMenu={setShowMenu}
              setInputMode={setInputMode}
              fileInputRef={fileInputRef}
            />
          )}

          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3">
              {selectedImages.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden group">
                  <img src={img} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(i)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white backdrop-blur-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

                    <div className="flex items-end gap-1 p-2 relative">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 mb-1 ml-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*,application/*,text/*"
                multiple
                className="hidden"
              />
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full text-[var(--ag-color-icon-default,#5B6B88)] hover:text-[var(--ag-color-icon-strong,#0A1B3D)] transition-colors hover:bg-[var(--ag-color-surface-strong,#DCE8F9)]"
                title={t('attachFile')}
              >
                <Plus size={22} strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 min-h-[44px] flex items-center px-1 py-3 mb-0.5 gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {inputMode === 'image' && (
                <div onClick={() => setInputMode(null)} className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ag-color-primary-subtle,#E8F0FF)] hover:bg-[var(--ag-color-surface-strong,#DCE8F9)] transition-colors text-[var(--ag-color-primary,#165DFF)] rounded-xl text-[14px] font-medium shrink-0">
                  <ImageIcon size={16} /> 创建图片
                </div>
              )}
              {inputMode === 'search' && (
                <div onClick={() => setInputMode(null)} className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ag-color-primary-subtle,#E8F0FF)] hover:bg-[var(--ag-color-surface-strong,#DCE8F9)] transition-colors text-[var(--ag-color-primary,#165DFF)] rounded-xl text-[14px] font-medium shrink-0">
                  <Globe size={16} /> 网页搜索
                </div>
              )}
              {inputMode === 'research' && (
                <div onClick={() => setInputMode(null)} className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ag-color-primary-subtle,#E8F0FF)] hover:bg-[var(--ag-color-surface-strong,#DCE8F9)] transition-colors text-[var(--ag-color-primary,#165DFF)] rounded-xl text-[14px] font-medium shrink-0">
                  <Telescope size={16} /> 深度研究
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDownWithMode}
                placeholder="有问题，尽管问"
                disabled={inputDisabled}
                className="w-full bg-transparent focus:ring-0 text-[16px] resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none p-0 m-0 leading-relaxed max-h-[200px] disabled:cursor-not-allowed disabled:opacity-60"
                rows={1}
              />
            </div>

            <div className="flex items-center flex-shrink-0 gap-1.5 mb-1.5 mr-1.5">
              <button
                className="p-2 rounded-full text-[var(--ag-color-icon-default,#5B6B88)] hover:text-[var(--ag-color-icon-strong,#0A1B3D)] hover:bg-[var(--ag-color-surface-strong,#DCE8F9)] transition-colors mr-1"
                title="Voice Input"
              >
                <Mic size={22} strokeWidth={2} />
              </button>

              {isGenerating ? (
                <button
                  onClick={handleStop}
                  className="w-[34px] h-[34px] flex items-center justify-center bg-[var(--ag-color-primary,#165DFF)] text-[var(--ag-color-icon-on-primary,#FFFFFF)] rounded-full hover:bg-[var(--ag-color-primary-hover,#4080FF)] active:bg-[var(--ag-color-primary-pressed,#0E42D2)] transition-colors transform active:scale-95"
                  title={t('stopGenerating')}
                >
                  <Square size={14} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={inputDisabled || (!input.trim() && selectedImages.length === 0)}
                  className={`w-[34px] h-[34px] flex items-center justify-center rounded-full transition-all transform active:scale-95 ${!inputDisabled && (input.trim() || selectedImages.length > 0) ? 'bg-[var(--ag-color-primary,#165DFF)] text-[var(--ag-color-icon-on-primary,#FFFFFF)] hover:bg-[var(--ag-color-primary-hover,#4080FF)]' : 'bg-transparent text-[var(--ag-color-icon-disabled,#8A97AD)] hover:bg-[var(--ag-color-surface-strong,#DCE8F9)] disabled:cursor-not-allowed disabled:opacity-60'}`}
                  title={t('sendMessage')}
                >
                  {input.trim() || selectedImages.length > 0 ? (
                    <ArrowUp size={20} strokeWidth={2.5} />
                  ) : (
                    <AudioLines size={18} strokeWidth={2} />
                  )}
                </button>
              )}
            </div>
            </div>
            </div>
            </div>
      <div className="text-center mt-4 text-[11px] text-gray-400 dark:text-gray-500 font-medium pointer-events-auto">
        {t('disclaimer')}
      </div>
      </div>
  );
};
