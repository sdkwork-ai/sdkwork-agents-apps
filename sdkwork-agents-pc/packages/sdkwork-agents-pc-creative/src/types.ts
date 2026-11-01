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
}

export interface CreativeSession {
  id: string;
  title: string;
  avatarUrl?: string;
  messages: CreativeMessage[];
  isPinned?: boolean;
}
