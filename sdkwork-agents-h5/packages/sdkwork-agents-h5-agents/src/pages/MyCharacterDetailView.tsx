import React, { useEffect, useState } from 'react';
import { ArrowLeft, MessageSquare, Settings2, ChevronRight } from 'lucide-react';
import { characterService, type Character } from '../services/CharacterService';
import { toast } from '../components/Toast';
import { t } from '../copy/mobileAgentTexts';

export interface MyCharacterDetailViewProps {
  /** Character id resolved from the host route params. */
  characterId?: string;
  onBack?: () => void;
  /** Host-navigated chat entry with the character. */
  onStartChat?: (character: Character) => void;
  /** Host-navigated edit entry (route with character id). */
  onEdit?: (character: Character) => void;
  /** Host toast port; defaults to the built-in agents toast. */
  notify?: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export const MyCharacterDetailView: React.FC<MyCharacterDetailViewProps> = ({
  characterId,
  onBack,
  onStartChat,
  onEdit,
  notify = toast,
}) => {
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    if (!characterId) return;
    void characterService.getCharacters().then((chars) => {
      const found = chars.find((c) => c.id === characterId);
      if (found) {
        setCharacter(found);
      } else {
        notify(t('agents.mobile.form.toast.loadFailed'), 'error');
        onBack?.();
      }
    });
  }, [characterId, notify, onBack]);

  if (!character) return null;

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-color,#F4F7FC)] overflow-hidden">
      {/* Header */}
      <header className="h-[56px] shrink-0 flex items-center justify-between px-2 bg-[var(--color-glass-bg,#FFFFFF)] z-10">
        <div className="flex items-center flex-1 gap-1">
          {onBack && (
            <button
              type="button"
              aria-label={t('agents.mobile.back')}
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-[var(--color-icon-strong,#0A1B3D)]" />
            </button>
          )}
        </div>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
          {t('agents.mobile.characters.detail.title')}
        </h1>
        <div className="flex items-center flex-1 justify-end">
          <button
            type="button"
            aria-label={t('agents.mobile.characters.menu.edit')}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--color-text-sub,#5B6B88)] active:bg-[var(--color-surface-muted,#EAF1FB)]"
          >
            <Settings2 className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center">
        {/* Profile Card */}
        <div className="w-full flex flex-col items-center justify-center py-10 px-6 bg-[var(--color-chat-other-bg,#FFFFFF)]">
          <div className="w-24 h-24 mb-4 rounded-full overflow-hidden">
            <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
          </div>

          <h2 className="text-[20px] font-bold text-[var(--color-text-main,#0A1B3D)] mb-1">
            {character.name}
          </h2>
          <p className="text-[14px] text-[var(--color-text-sub,#5B6B88)] mb-6">
            {t('agents.mobile.characters.detail.visibility.private')}
          </p>

          <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary,#5B6B88)]/90 text-center px-4 line-clamp-3">
            {character.desc}
          </p>
        </div>

        {/* Info */}
        <div className="w-full mt-2 bg-[var(--color-chat-other-bg,#FFFFFF)] py-2">
          <div className="flex flex-col px-4 py-3 transition-colors">
            <span className="text-[16px] text-[var(--color-text-main,#0A1B3D)] mb-1">
              {t('agents.mobile.characters.detail.systemPrompt')}
            </span>
            <span className="text-[14px] text-[var(--color-text-sub,#5B6B88)] line-clamp-2">
              {character.prompt || t('agents.mobile.characters.detail.systemPrompt.empty')}
            </span>
          </div>
          <div className="flex items-center px-4 py-4 transition-colors">
            <span className="text-[16px] text-[var(--color-text-main,#0A1B3D)] flex-1">
              {t('agents.mobile.characters.detail.voice')}
            </span>
            <span className="text-[15px] text-[var(--color-text-sub,#5B6B88)] flex items-center gap-2">
              {t('agents.mobile.characters.detail.voice.default')}
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="w-full mt-6 px-4 pb-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onStartChat?.(character)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--color-primary-blue,#165DFF)] text-white rounded-full font-bold active:opacity-80 transition-opacity"
          >
            <MessageSquare className="w-5 h-5 text-[var(--color-icon-strong,#0A1B3D)]" />
            <span>{t('agents.mobile.characters.detail.chat')}</span>
          </button>
          <button
            type="button"
            onClick={() => onEdit?.(character)}
            className="w-full py-3 bg-[var(--color-chat-other-bg,#FFFFFF)] text-[var(--color-text-main,#0A1B3D)] rounded-full font-medium active:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors"
          >
            {t('agents.mobile.characters.detail.edit')}
          </button>
        </div>
      </div>
    </div>
  );
};
