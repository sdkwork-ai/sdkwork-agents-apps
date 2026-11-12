import type {
  GenerationMediaResult,
  GenerationRecord,
} from '@sdkwork/agents-pc-core/sdk/generationsService';
import {
  resolveCreativeCreationType,
} from '@sdkwork/agents-pc-core/sdk/creationTypes';
import { creativeModelCatalogService, resolveCreativeDispatch } from '@sdkwork/agents-pc-commons';
import {
  readAccountScopedItem,
  removeAccountScopedItem,
  writeAccountScopedItem,
} from '@sdkwork/agents-pc-core/session';
import { uuid } from '@sdkwork/utils';

import type { CreativeMessage, CreativeSession } from '../types';

async function loadGenerationsService() {
  const { agentsGenerationsService } = await import(
    '@sdkwork/agents-pc-core/sdk/generationsService'
  );
  return agentsGenerationsService;
}

/**
 * Display modality for a record. The previous implementation collapsed every
 * non-video modality onto `image`; the record already carries the modality the
 * command was dispatched with, so surface it as-is.
 */
function toMode(record: GenerationRecord): string {
  const modality = (record as { modality?: string }).modality;
  return modality?.trim() ? modality.trim() : 'image';
}

function toModelInfo(record: GenerationRecord): string {
  const provider = record.sourceProvider?.trim();
  if (provider) return provider;
  return `SDKWork ${toMode(record).replace(/_/gu, ' ')}`;
}

function toProgress(record: GenerationRecord): number {
  if (record.status === 'succeeded') return 100;
  if (record.status === 'running') return 67;
  return 29;
}

/**
 * Honest stage label for the progress card. The backend record carries a
 * status, not a percentage — the previous 29/67/100 numbers implied a progress
 * the wire never provided, so the card shows the real stage instead.
 */
function toStageLabel(record: GenerationRecord, mode: string): string {
  if (record.status === 'queued') return '排队中';
  if (record.status === 'requires_action') return '等待确认';
  switch (mode) {
    case 'image':
      return '生成画面中...';
    case 'video':
    case 'digital_human':
    case 'action':
      return '生成视频中...';
    case 'music':
      return '创作音乐中...';
    case 'voice':
      return '合成配音中...';
    case 'sfx':
      return '生成音效中...';
    default:
      return '生成中...';
  }
}

function toAssistantMessage(
  record: GenerationRecord,
  media: readonly GenerationMediaResult[],
  messageId = record.id,
): CreativeMessage {
  const mode = toMode(record);
  const imageUrls = media.filter((item) => item.kind === 'image').map((item) => item.url);
  const videoUrls = media.filter((item) => item.kind === 'video').map((item) => item.url);
  const audioUrls = media.filter((item) => item.kind === 'audio').map((item) => item.url);
  // A reloaded failed/canceled record must render as a terminal failure, not
  // as an eternal loading card.
  const failed = record.status === 'failed' || record.status === 'canceled';
  return {
    id: messageId,
    role: 'assistant',
    text: record.promptPreview || record.operationType,
    stage: record.status === 'succeeded' ? 'completed' : failed ? 'failed' : 'loading',
    errorText: failed
      ? record.status === 'canceled' ? '本次生成已取消' : '本次生成失败，可重新生成'
      : undefined,
    progress: toProgress(record),
    mode,
    modelInfo: toModelInfo(record),
    imageUrl: imageUrls[0],
    imageUrls,
    videoUrl: videoUrls[0],
    videoUrls,
    audioUrl: audioUrls[0],
    audioUrls,
  };
}

/**
 * Caller-provided generation dispatch options. `commandParameters` lands in the
 * generations command `parameters` object (vendor routing, generation config,
 * reference media); `commandInputAssetIds` carries Drive node ids for surfaces
 * that resolve assets server-side; `previewImageUrl` is the first reference
 * upload, echoed on the pending card so the user sees what the command is
 * generating from.
 */
export interface CreativeGenerationOptions {
  hasReferenceImages?: boolean;
  /**
   * Precise generation mode resolved from the selected model's catalog profile
   * (`reference_to_video`, `start_end_frame`, ...). The app API routes by
   * operation, so this rides `parameters.generationMode` and lets the vendor
   * adapter pick the matching surface.
   */
  generationMode?: string;
  commandParameters?: Record<string, unknown>;
  commandInputAssetIds?: string[];
  previewImageUrl?: string;
  /** Conversation grouping key of the active creative session. */
  conversationId?: string;
}

/** Drop blank entries so absent settings never widen the command payload. */
function compactCreativeCommandParameters(
  record: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const compacted = Object.fromEntries(
    Object.entries(record).filter(([, value]) => (
      value !== undefined
      && value !== null
      && (!(Array.isArray(value)) || value.length > 0)
      && (!(typeof value === 'string') || value.trim().length > 0)
      && (!(typeof value === 'object') || Object.keys(value as Record<string, unknown>).length > 0)
    )),
  );
  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

/** The slice of the generations service the conversation builder consumes. */
interface AgentsGenerationsServiceLike {
  listMediaResults(generationId: string): Promise<GenerationMediaResult[]>;
}

// ---------------------------------------------------------------------------
// Client-side session metadata
// ---------------------------------------------------------------------------

/**
 * The backend groups records into conversations through `conversationId`;
 * session titles, pins and deletions are presentation-only state and live in
 * account-scoped storage keyed by that conversation id, so a reload keeps them
 * and another account never sees them.
 */
const SESSION_TITLE_PREFIX = 'creative_session_title:';
const SESSION_PINNED_PREFIX = 'creative_session_pinned:';
const SESSION_HIDDEN_PREFIX = 'creative_session_hidden:';
const HIDDEN_RECORD_IDS_KEY = 'creative_hidden_record_ids';
/** Sidebar history read ceiling: 5 keyset pages of 100 records. */
const GET_SESSIONS_MAX_PAGES = 5;

function readLocalFlag(key: string): boolean {
  return readAccountScopedItem(key) === '1';
}

function writeLocalFlag(key: string, value: boolean): void {
  if (value) writeAccountScopedItem(key, '1');
  else removeAccountScopedItem(key);
}

export const CreativeSessionStore = {
  title(conversationId: string): string | null {
    return readAccountScopedItem(SESSION_TITLE_PREFIX + conversationId);
  },
  rename(conversationId: string, title: string): void {
    writeAccountScopedItem(SESSION_TITLE_PREFIX + conversationId, title);
  },
  isPinned(conversationId: string): boolean {
    return readLocalFlag(SESSION_PINNED_PREFIX + conversationId);
  },
  setPinned(conversationId: string, pinned: boolean): void {
    writeLocalFlag(SESSION_PINNED_PREFIX + conversationId, pinned);
  },
  isHidden(conversationId: string): boolean {
    return readLocalFlag(SESSION_HIDDEN_PREFIX + conversationId);
  },
  setHidden(conversationId: string, hidden: boolean): void {
    writeLocalFlag(SESSION_HIDDEN_PREFIX + conversationId, hidden);
  },
  /**
   * Record ids the user deleted from a conversation. Deletion is presentational
   * (the generations contract has no record delete), so the hidden set keeps a
   * reload from resurrecting the turn.
   */
  hiddenRecordIds(): Set<string> {
    try {
      const raw = readAccountScopedItem(HIDDEN_RECORD_IDS_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
    } catch {
      return new Set();
    }
  },
  hideRecord(recordId: string): void {
    const ids = CreativeSessionStore.hiddenRecordIds();
    ids.add(recordId);
    writeAccountScopedItem(HIDDEN_RECORD_IDS_KEY, JSON.stringify([...ids]));
  },
};

export class CreativeService {
  /**
   * Builds one conversation session from its records: turns replay oldest
   * first, result URLs resolve in parallel, and the title/pin presentation
   * state comes from the local store.
   */
  static async buildConversationSession(
    generationsService: AgentsGenerationsServiceLike,
    conversationId: string,
    records: readonly GenerationRecord[],
    options: { resolveMedia?: boolean } = {},
  ): Promise<CreativeSession | null> {
    if (CreativeSessionStore.isHidden(conversationId)) return null;
    // Locally deleted turns stay deleted across reloads.
    const hiddenRecords = CreativeSessionStore.hiddenRecordIds();
    // `listRecords` returns newest first; turns replay oldest first.
    const turns = [...records]
      .filter((record) => !hiddenRecords.has(record.id))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    // Result URLs resolve per record in parallel; sequential awaits made a
    // long conversation's load linear in its turn count. The sidebar list
    // defers media to the per-session load so a full history read costs list
    // queries only; only the session the user actually opens pays the
    // per-turn result fetches.
    const mediaByRecord = new Map<string, GenerationMediaResult[]>();
    if (options.resolveMedia !== false) {
      await Promise.all(turns
        .filter((record) => record.status === 'succeeded')
        .map(async (record) => {
          const media = await generationsService
            .listMediaResults(record.id)
            .catch(() => [] as GenerationMediaResult[]);
          mediaByRecord.set(record.id, media);
        }));
    }
    const messages: CreativeMessage[] = [];
    for (const record of turns) {
      const media = mediaByRecord.get(record.id) ?? [];
      const prompt = record.promptPreview || record.operationType;
      messages.push({
        id: `${record.id}-prompt`,
        role: 'user',
        text: prompt,
      });
      messages.push(toAssistantMessage(record, media));
    }
    const firstPrompt = turns[0]?.promptPreview || '';
    const storedTitle = CreativeSessionStore.title(conversationId);
    return {
      id: conversationId,
      title: storedTitle
        || (firstPrompt.length > 18 ? `${firstPrompt.slice(0, 18)}...` : firstPrompt)
        || '创作会话',
      isPinned: CreativeSessionStore.isPinned(conversationId),
      messages,
    };
  }

  /**
   * Authoritative turn list for one conversation. The sidebar reassembles from
   * the newest global page, which truncates conversations that fall outside
   * the page window; opening a session re-fetches its own turns so a long
   * conversation always shows completely.
   */
  static async loadSession(conversationId: string): Promise<CreativeSession | null> {
    try {
      const generationsService = await loadGenerationsService();
      const page = await generationsService.listRecords({
        pageSize: 100,
        conversationId,
      });
      return await CreativeService.buildConversationSession(
        generationsService,
        conversationId,
        page.items,
      );
    } catch (error) {
      console.error('Failed to load the conversation turns.', error);
      return null;
    }
  }

  /**
   * Reassembles the creative sessions from the generation records.
   *
   * Records sharing a `conversationId` are turns of ONE multi-turn session:
   * the previous implementation mapped every record to its own session, which
   * fragmented a conversation into one session per generation after a reload.
   * Records without a grouping key (legacy or direct-API) stay standalone.
   */
  static async getSessions(): Promise<CreativeSession[]> {
    try {
      const generationsService = await loadGenerationsService();
      // The keyset cursor works, so the sidebar can read the whole history:
      // a single page used to hide conversations older than the page window
      // from the list entirely.
      const records: GenerationRecord[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < GET_SESSIONS_MAX_PAGES; page += 1) {
        const result = await generationsService.listRecords({
          pageSize: 100,
          ...(cursor ? { cursor } : {}),
        });
        records.push(...result.items);
        cursor = result.nextCursor;
        if (!cursor) break;
      }
      const groups = new Map<string, GenerationRecord[]>();
      for (const record of records) {
        const conversationId = record.conversationId?.trim() || `legacy:${record.id}`;
        const bucket = groups.get(conversationId);
        if (bucket) bucket.push(record);
        else groups.set(conversationId, [record]);
      }
      // Groups inherit the page's newest-first order; the first group is the
      // conversation the view opens, and the only one that pays the media
      // fetches at startup.
      const sessions: CreativeSession[] = [];
      let newestConversation = true;
      for (const [conversationId, groupRecords] of groups) {
        const session = await CreativeService.buildConversationSession(
          generationsService,
          conversationId,
          groupRecords,
          { resolveMedia: newestConversation },
        );
        newestConversation = false;
        if (session) sessions.push(session);
      }
      sessions.sort((left, right) => {
        if (left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;
        return 0;
      });
      return sessions;
    } catch (error) {
      // The generations app service may be unavailable in hosted portal
      // environments (no route registered); the creative page degrades to an
      // empty session list instead of failing to load.
      console.error('Failed to load generation sessions.', error);
      return [];
    }
  }

  static async generateContent(
    prompt: string,
    mode: string,
    onUpdate: (message: CreativeMessage) => void,
    model?: string,
    options: CreativeGenerationOptions = {},
  ): Promise<CreativeMessage> {
    const generationsService = await loadGenerationsService();
    // The mode is preserved. It used to be collapsed by
    // `mode === 'video' ? 'video' : 'image'`, which silently replayed music,
    // voice, sound-effect, digital-human and action prompts as text-to-image.
    //
    // `agent` is deliberately left on its previous assisted-image behaviour: it
    // is not a generation modality, and re-pointing it is a separate product
    // decision from the modality-collapse fix.
    //
    // The same helper backs the credit estimate, so the priced command and the
    // submitted command always route identically.
    const dispatch = resolveCreativeDispatch(mode, {
      hasReferenceImages: options.hasReferenceImages,
      generationMode: options.generationMode,
    });
    if (!dispatch) {
      throw new Error(
        `“${mode}” 不是内容生成类型，无法提交生成请求。`,
      );
    }
    const modality = dispatch.modality;
    // Resolve the selected model through the unified creative model catalog:
    // stale or deprecated ids fall back to the replacement/default model.
    const resolvedModel = model
      ? creativeModelCatalogService.resolveSelection(modality, model)
      : undefined;
    const resolvedModelLabel = resolvedModel
      ? creativeModelCatalogService.getDefinition(modality, resolvedModel)?.label ?? resolvedModel
      : undefined;
    // The command body carries the bare model id; the catalog vendor code must
    // ride along as `parameters.vendor`, or the backend vendor resolution
    // falls back to the modality default and non-OpenAI models are dispatched
    // to the wrong upstream.
    const resolvedVendorCode = resolvedModel
      ? creativeModelCatalogService.getDefinition(modality, resolvedModel)?.vendorCode
      : undefined;
    const commandParameters = compactCreativeCommandParameters({
      ...(resolvedVendorCode ? { vendor: resolvedVendorCode } : {}),
      ...options.commandParameters,
    });
    const pendingMessage: CreativeMessage = {
      id: uuid(),
      role: 'assistant',
      text: prompt,
      stage: 'thinking',
      progress: 0,
      stageLabel: '排队中',
      previewUrl: options.previewImageUrl,
      mode: resolveCreativeCreationType(mode).id,
      modelInfo: resolvedModelLabel ?? `SDKWork ${modality.replace(/_/gu, ' ')}`,
      imageUrls: [],
      videoUrls: [],
      audioUrls: [],
    };
    onUpdate(pendingMessage);

    const command = await generationsService.create({
      modality,
      operationType: dispatch.operationType,
      prompt,
      ...(options.conversationId?.trim()
        ? { conversationId: options.conversationId.trim() }
        : {}),
      ...(resolvedModel ? { model: resolvedModel } : {}),
      ...(commandParameters ? { parameters: commandParameters } : {}),
      ...(options.commandInputAssetIds?.length
        ? { inputAssetIds: options.commandInputAssetIds }
        : {}),
    });
    const record = await generationsService.waitForCompletion(command.generation, {
      onStatus(current) {
        onUpdate({
          ...pendingMessage,
          stage: current.status === 'queued' ? 'thinking' : 'loading',
          progress: toProgress(current),
          stageLabel: toStageLabel(current, pendingMessage.mode ?? ''),
          modelInfo: toModelInfo(current),
        });
      },
    });
    const media = await generationsService.listMediaResults(record.id);
    if (media.length === 0) {
      throw new Error('Generation completed without a renderable media result.');
    }
    const finalMessage = toAssistantMessage(record, media, pendingMessage.id);
    onUpdate(finalMessage);
    return finalMessage;
  }
}
