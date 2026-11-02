import React from 'react';
import type { Character } from '../services/CharacterService';

export interface CharacterCardProps {
  character: Character;
  onClick?: () => void;
  /** Gesture handlers spread onto the row (long-press, context menu). */
  onLongPressProps?: React.DOMAttributes<HTMLDivElement>;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onClick,
  onLongPressProps,
}) => {
  return (
    <div
      className="bg-[var(--color-chat-other-bg,#FFFFFF)] px-4 py-3.5 flex items-center gap-4 active:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors cursor-pointer select-none touch-callout-none"
      onClick={onClick}
      {...onLongPressProps}
    >
      <img
        src={character.avatar}
        className="w-12 h-12 rounded-full object-cover shrink-0 pointer-events-none"
        alt={character.name}
      />
      <div className="flex-1 min-w-0 pointer-events-none">
        <h3 className="text-[16px] font-medium text-[var(--color-text-main,#0A1B3D)] truncate">
          {character.name}
        </h3>
        <p className="text-[13px] text-[var(--color-text-sub,#5B6B88)] truncate mt-0.5">
          {character.desc}
        </p>
      </div>
    </div>
  );
};
