export type CreativeMediaKind = 'image' | 'video' | 'audio';

/**
 * Asset-catalog state of one generation result behind an assistant turn.
 * `assetId` is set once the result lives in the caller's `sdkwork-assets`
 * catalog (server auto-save on completion, or the manual save action).
 */
export interface CreativeResultAssetState {
  resultId: string;
  kind: CreativeMediaKind;
  assetId?: string;
}

export interface CreativeMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  stage?: 'thinking' | 'loading' | 'completed' | 'failed';
  progress?: number;
  /** Status chip text while generating ("排队中" / "生成中"); replaces the
   * fabricated percentage, which no backend progress field ever backed. */
  stageLabel?: string;
  /** Terminal failure copy for a reloaded failed/canceled record. */
  errorText?: string;
  /** First reference upload, shown dimmed as the generation preview while
   * the command is running. The vendor result replaces it on completion. */
  previewUrl?: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  videoUrls?: string[];
  /** Music / voice / sound-effect results (audio media). */
  audioUrl?: string;
  audioUrls?: string[];
  suggestions?: string[];
  mode?: string;
  modelInfo?: string;
  /** Generations record behind this turn; the handle the asset actions use. */
  generationId?: string;
  /** Per-result asset-catalog state of a completed turn. */
  results?: CreativeResultAssetState[];
}

/** Whether a completed turn has every result saved to the asset catalog. */
export function isSavedToAssets(message: CreativeMessage): boolean {
  const results = message.results ?? [];
  return results.length > 0 && results.every((result) => Boolean(result.assetId));
}

/** Whether a completed turn still has results the user can save by hand. */
export function hasUnsavedResults(message: CreativeMessage): boolean {
  return Boolean(message.generationId)
    && (message.results ?? []).some((result) => !result.assetId);
}

export interface CreativeSession {
  id: string;
  title: string;
  avatarUrl?: string;
  messages: CreativeMessage[];
  isPinned?: boolean;
}
