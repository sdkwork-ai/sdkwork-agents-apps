import type {
  CreativeModelCatalogSyncState,
  CreativeModelCatalogSyncStats,
  CreativeModelDefinition,
  CreativeModelLifecycle,
  CreativeModelModality,
  CreativeModelReferencePrice,
  RemoteCreativeModelItem,
} from './creativeModelCatalogTypes';
import {
  CREATIVE_MODEL_RELEASE_STAGE,
  CREATIVE_MODEL_SHELF_STATE,
} from './creativeModelCatalogTypes';
import { videoParametersFromProfiles, vendorDefaultParameters } from './creativeModelParameters';
import type { CatalogVideoProfile } from './creativeModelParameters';
import {
  CREATIVE_MODEL_SELECTION_PROFILES,
  REMOTE_SYNC_MODALITIES,
  STATIC_CREATIVE_MODELS,
  STATIC_DEFAULT_MODEL_IDS,
} from './staticCreativeModelCatalog';

const REMOTE_LAYER_STORAGE_KEY = 'sdkwork_creative_model_catalog_remote_v4';
const SELECTED_MODELS_STORAGE_KEY = 'sdkwork_creative_selected_models_v1';
const SYNC_TTL_MS = 5 * 60 * 1000;
const REMOTE_PAGE_SIZE = 100;
const MAX_REMOTE_PAGES = 10;
const MAX_REPLACEMENT_HOPS = 5;

/** Persisted remote layer version; a version bump discards an older layer. */
const REMOTE_LAYER_VERSION = 4;

/**
 * Remote-managed layer persisted between sessions. Remote entries are the
 * authoritative subset for their modality: models that disappear from a
 * fresh snapshot are removed; models flagged deprecated/retired or carrying
 * a replacement are migrated.
 */
interface PersistedRemoteLayer {
  version: typeof REMOTE_LAYER_VERSION;
  syncedAt: string;
  entries: Partial<Record<CreativeModelModality, CreativeModelDefinition[]>>;
}

function isCreativeModelModality(value: string): value is CreativeModelModality {
  return value in STATIC_CREATIVE_MODELS;
}

function readJsonStorage<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private mode, quota); the catalog still
    // works from memory with the static baseline.
  }
}

/** Map a wire release/shelf state pair to the client lifecycle. */
function toLifecycle(releaseStage: number | null, shelfState: number | null): CreativeModelLifecycle {
  if (shelfState != null && shelfState >= CREATIVE_MODEL_SHELF_STATE.ARCHIVED) return 'retired';
  if (releaseStage != null && releaseStage >= CREATIVE_MODEL_RELEASE_STAGE.RETIRED) return 'retired';
  if (releaseStage != null && releaseStage >= CREATIVE_MODEL_RELEASE_STAGE.DEPRECATED) return 'deprecated';
  if (releaseStage != null && releaseStage >= CREATIVE_MODEL_RELEASE_STAGE.PREVIEW) return 'preview';
  return 'active';
}

function normalizeVendorCode(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/**
 * Whether one catalog row belongs in a creation type's picker.
 *
 * The catalog's `modalities` field unions input and output modalities, so a
 * plain modality query also returns models that merely *accept* the media it
 * is asked about (a chat model that reads video input listed under video
 * generation). The picker therefore requires the model to produce the
 * creation type's output modality and to declare the matching capability, and
 * keeps only vendors the generations provider adapter can dispatch.
 *
 * @param modality - creative creation type being listed.
 * @param item - one row of the app models catalog.
 * @returns whether the row is a dispatchable model of this creation type.
 */
export function isCreationModel(modality: CreativeModelModality, item: RemoteCreativeModelItem): boolean {
  const profile = CREATIVE_MODEL_SELECTION_PROFILES[modality];
  if (!profile) return false;
  if (!profile.vendorCodes.includes(normalizeVendorCode(item.vendorCode))) return false;
  const modelId = item.model.trim().toLowerCase();
  if (profile.excludedModelIdTokens.some((token) => modelId.includes(token))) return false;

  const outputModalities = (item.outputModalities ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value !== '');
  // Older app API responses carry no `outputModalities`; `modalities` is the
  // union, so it is only a conservative fallback.
  const produced = outputModalities.length > 0
    ? outputModalities
    : (item.modalities ?? []).map((value) => value.trim().toLowerCase());
  if (!produced.some((value) => profile.outputModalities.includes(value))) return false;

  const required = profile.capability;
  if (required === null) return true;
  const declared = (item.capabilities ?? []).map((value) => value.trim().toLowerCase());
  return declared.length === 0 || declared.includes(required);
}

/**
 * Whether a definition already persisted in the remote layer may stay.
 *
 * The vendor allowlist heals a layer written by an older build: a persisted
 * entry whose vendor no creation type can dispatch is dropped on load instead
 * of surviving until the next successful sync.
 */
function isPersistedDefinitionAllowed(
  modality: CreativeModelModality,
  definition: CreativeModelDefinition,
): boolean {
  const profile = CREATIVE_MODEL_SELECTION_PROFILES[modality];
  if (!profile) return false;
  const vendor = normalizeVendorCode(definition.vendorCode);
  return vendor !== '' && profile.vendorCodes.includes(vendor);
}

function optionalTrimmed(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/** Map the wire reference price rows onto the picker's price shape. */
function mapReferencePrices(
  prices: RemoteCreativeModelItem['officialReferencePrices'],
): CreativeModelReferencePrice[] | undefined {
  if (!prices || prices.length === 0) return undefined
  const mapped = prices
    .filter((price) => price.billingMeter.trim() !== '' && Number.isFinite(Number(price.unitPrice)))
    .map((price) => ({
      regionCode: price.regionCode,
      meterCode: price.billingMeter,
      unitPrice: price.unitPrice,
      currency: price.currency,
    }))
  return mapped.length > 0 ? mapped : undefined
}

function toRemoteDefinition(
  item: RemoteCreativeModelItem,
  modality: CreativeModelModality,
  index: number,
  knownStaticIds: ReadonlySet<string>,
): CreativeModelDefinition {
  // A model the static baseline already carries keeps its per-model catalog
  // profile; a newly published model gets the vendor surface defaults so the
  // picker still constrains itself instead of offering every knob.
  const parameters = knownStaticIds.has(item.model)
    ? undefined
    : vendorDefaultParameters(modality, item.vendorCode);
  const referencePrices = mapReferencePrices(item.officialReferencePrices);
  const familyCode = optionalTrimmed(item.familyCode);
  const colorToken = optionalTrimmed(item.colorToken);
  const docsUrl = optionalTrimmed(item.docsUrl);
  return {
    id: item.model,
    modality,
    label: item.displayName || item.model,
    desc: item.description || item.capabilityIntro || `由 ${item.vendorCode} 提供的模型`,
    lifecycle: toLifecycle(item.releaseStage, item.shelfState),
    replacementModelId: item.replacementModel || null,
    vendorCode: item.vendorCode,
    ...(parameters === undefined ? {} : { parameters }),
    ...(referencePrices === undefined ? {} : { referencePrices }),
    ...(familyCode === undefined ? {} : { familyCode }),
    ...(colorToken === undefined ? {} : { colorToken }),
    ...(docsUrl === undefined ? {} : { docsUrl }),
    source: 'remote',
    order: index,
  };
}

function definitionsEqual(left: CreativeModelDefinition, right: CreativeModelDefinition): boolean {
  return left.label === right.label
    && left.desc === right.desc
    && left.lifecycle === right.lifecycle
    && (left.replacementModelId ?? null) === (right.replacementModelId ?? null);
}

function isPickerVisible(definition: CreativeModelDefinition): boolean {
  return definition.lifecycle !== 'retired';
}

export class CreativeModelCatalogService {
  private version = 0;

  private listeners = new Set<() => void>();

  private remoteLayer: PersistedRemoteLayer = CreativeModelCatalogService.loadRemoteLayer();

  private selectedIds: Partial<Record<CreativeModelModality, string>> =
    readJsonStorage<Partial<Record<CreativeModelModality, string>>>(SELECTED_MODELS_STORAGE_KEY) ?? {};

  private syncState: CreativeModelCatalogSyncState = {
    status: 'idle',
    lastSyncedAt: this.remoteLayer.syncedAt ?? null,
    lastError: null,
    lastStats: null,
  };

  private syncInFlight: Promise<CreativeModelCatalogSyncStats> | null = null;
  private lastSyncStartedAt = 0;

  private mergedCache = new Map<CreativeModelModality, CreativeModelDefinition[]>();
  private visibleCache = new Map<CreativeModelModality, CreativeModelDefinition[]>();
  private indexCache = new Map<CreativeModelModality, Map<string, CreativeModelDefinition>>();
  /** Runtime catalog video profiles keyed by model catalog key (`vendor/modelId`). */
  private videoProfilesByKey = new Map<string, CatalogVideoProfile[]>();

  private static loadRemoteLayer(): PersistedRemoteLayer {
    const persisted = readJsonStorage<PersistedRemoteLayer>(REMOTE_LAYER_STORAGE_KEY);
    if (!persisted || persisted.version !== REMOTE_LAYER_VERSION || !persisted.entries) {
      return { version: REMOTE_LAYER_VERSION, syncedAt: '', entries: {} };
    }
    // Drop every persisted entry no creation type can dispatch, so a layer
    // written before the per-creation-type filter heals on the first load.
    const entries: Partial<Record<CreativeModelModality, CreativeModelDefinition[]>> = {};
    for (const [rawModality, definitions] of Object.entries(persisted.entries)) {
      if (!isCreativeModelModality(rawModality) || !Array.isArray(definitions)) continue;
      const modality: CreativeModelModality = rawModality;
      const allowed = definitions.filter((definition) => (
        isPersistedDefinitionAllowed(modality, definition)
      ));
      if (allowed.length > 0) entries[modality] = allowed;
    }
    return { version: REMOTE_LAYER_VERSION, syncedAt: persisted.syncedAt ?? '', entries };
  }

  // ---------------------------------------------------------------- listeners

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.version += 1;
    this.mergedCache.clear();
    this.visibleCache.clear();
    this.indexCache.clear();
    for (const listener of this.listeners) {
      listener();
    }
  }

  /** Monotonic store revision; lets useSyncExternalStore cache per revision. */
  getVersion(): number {
    return this.version;
  }

  // ------------------------------------------------------------------ queries

  /** All merged definitions for a modality, including retired entries. */
  getDefinitions(modality: CreativeModelModality): CreativeModelDefinition[] {
    const cached = this.mergedCache.get(modality);
    if (cached) return cached;
    const merged = this.mergeModality(modality);
    this.mergedCache.set(modality, merged);
    return merged;
  }

  /** Picker-visible definitions (retired entries are hidden). */
  getModels(modality: CreativeModelModality): CreativeModelDefinition[] {
    const cached = this.visibleCache.get(modality);
    if (cached) return cached;
    const visible = this.getDefinitions(modality).filter(isPickerVisible);
    this.visibleCache.set(modality, visible);
    return visible;
  }

  getDefinition(modality: CreativeModelModality, modelId: string | undefined): CreativeModelDefinition | null {
    if (!modelId) return null;
    return this.getIndex(modality).get(modelId) ?? null;
  }

  private getIndex(modality: CreativeModelModality): Map<string, CreativeModelDefinition> {
    const cached = this.indexCache.get(modality);
    if (cached) return cached;
    const index = new Map<string, CreativeModelDefinition>();
    for (const definition of this.getDefinitions(modality)) {
      index.set(definition.id, definition);
    }
    this.indexCache.set(modality, index);
    return index;
  }

  /**
   * Merge policy:
   * - static baseline entries always come first, in catalog order;
   * - a remote entry with the same id overrides the static lifecycle
   *   (deprecation/retirement) while keeping the curated presentation;
   * - remote-only entries are appended in server order;
   * - remote entries dropped by the server disappear automatically
   *   (the persisted layer is replaced on every sync snapshot).
   */
  private mergeModality(modality: CreativeModelModality): CreativeModelDefinition[] {
    const staticDefinitions = STATIC_CREATIVE_MODELS[modality].map((definition) => ({ ...definition }));
    const staticIndex = new Map(staticDefinitions.map((definition) => [definition.id, definition]));
    const remoteEntries = this.remoteLayer.entries[modality] ?? [];
    const merged: CreativeModelDefinition[] = staticDefinitions;
    const seen = new Set(staticDefinitions.map((definition) => definition.id));
    let order = staticDefinitions.length;
    for (const remote of remoteEntries) {
      const existing = staticIndex.get(remote.id);
      if (existing) {
        existing.lifecycle = remote.lifecycle;
        existing.replacementModelId = remote.replacementModelId ?? null;
        // The catalog's published reference price is a live attribute: keep it
        // on the curated static entry rather than duplicating the row.
        if (remote.referencePrices !== undefined) {
          existing.referencePrices = remote.referencePrices;
        }
        if (remote.familyCode !== undefined) existing.familyCode = remote.familyCode;
        if (remote.colorToken !== undefined) existing.colorToken = remote.colorToken;
        if (remote.docsUrl !== undefined) existing.docsUrl = remote.docsUrl;
        continue;
      }
      // Two catalog regions can publish the same model id; the picker states
      // one entry per model, so keep the first (server-ordered) occurrence.
      if (seen.has(remote.id)) continue;
      seen.add(remote.id);
      merged.push({ ...remote, order });
      order += 1;
    }
    if (modality === 'video' && this.videoProfilesByKey.size > 0) {
      for (const definition of merged) {
        const catalogKey = `${(definition.vendorCode ?? '').trim().toLowerCase()}/${definition.id}`;
        const profiles = this.videoProfilesByKey.get(catalogKey);
        if (!profiles) continue;
        const video = videoParametersFromProfiles(definition.vendorCode, profiles);
        if (video === undefined) continue;
        definition.parameters = { ...definition.parameters, video };
      }
    }
    return merged;
  }

  // --------------------------------------------------------------- selection

  getDefaultModelId(modality: CreativeModelModality): string {
    return this.resolveSelection(modality, STATIC_DEFAULT_MODEL_IDS[modality]);
  }

  /**
   * Resolve a requested model id against the merged catalog:
   * unknown/stale ids fall back to the modality default; deprecated or
   * retired ids follow their replacement chain (bounded) before falling
   * back to the default.
   */
  resolveSelection(modality: CreativeModelModality, modelId: string | undefined): string {
    if (!modelId) return this.getDefaultModelId(modality);
    const index = this.getIndex(modality);
    let current = index.get(modelId);
    if (!current) return this.getDefaultModelId(modality);
    if (current.lifecycle === 'active' || current.lifecycle === 'preview') return current.id;
    const visited = new Set<string>([current.id]);
    let replacementId = current.replacementModelId ?? null;
    for (let hop = 0; hop < MAX_REPLACEMENT_HOPS && replacementId; hop += 1) {
      if (visited.has(replacementId)) break;
      visited.add(replacementId);
      const replacement = index.get(replacementId);
      if (!replacement) break;
      if (replacement.lifecycle === 'active' || replacement.lifecycle === 'preview') {
        return replacement.id;
      }
      replacementId = replacement.replacementModelId ?? null;
    }
    return this.getDefaultModelId(modality);
  }

  /**
   * Effective selection for a modality. Priority: persisted selection
   * (auto-migrated when deprecated) > parent-provided initial id (only when
   * it genuinely belongs to this modality, bootstrapped once) > default.
   */
  getSelectedModelId(modality: CreativeModelModality, initialModelId?: string): string {
    const persisted = this.selectedIds[modality];
    if (persisted) {
      const resolved = this.resolveSelection(modality, persisted);
      if (resolved !== persisted) {
        this.persistSelection(modality, resolved);
      }
      return resolved;
    }
    if (initialModelId) {
      const resolved = this.resolveSelection(modality, initialModelId);
      if (resolved === initialModelId) {
        this.persistSelection(modality, resolved);
        return resolved;
      }
    }
    return this.getDefaultModelId(modality);
  }

  selectModel(modality: CreativeModelModality, modelId: string): void {
    if (this.selectedIds[modality] === modelId) return;
    this.persistSelection(modality, modelId);
  }

  private persistSelection(modality: CreativeModelModality, modelId: string): void {
    this.selectedIds = { ...this.selectedIds, [modality]: modelId };
    writeJsonStorage(SELECTED_MODELS_STORAGE_KEY, this.selectedIds);
    this.notify();
  }

  getSyncState(): CreativeModelCatalogSyncState {
    return this.syncState;
  }

  // -------------------------------------------------------------------- sync

  /**
   * Pull the per-modality snapshots from the models app API and apply them
   * locally (add / update / remove / deprecate). TTL-guarded: repeated calls
   * within the sync window reuse the in-flight or last completed request.
   * Remote sync is best-effort — failures keep the last persisted layer and
   * never break the static baseline.
   */
  async refresh(options: { force?: boolean } = {}): Promise<CreativeModelCatalogSyncStats> {
    const now = Date.now();
    if (this.syncInFlight) return this.syncInFlight;
    if (!options.force && this.syncState.status === 'ready' && this.syncState.lastSyncedAt) {
      if (now - this.lastSyncStartedAt < SYNC_TTL_MS) {
        return this.syncState.lastStats ?? this.emptyStats();
      }
    }
    this.lastSyncStartedAt = now;
    this.syncState = { ...this.syncState, status: 'syncing', lastError: null };
    this.notify();
    this.syncInFlight = this.runSync().finally(() => {
      this.syncInFlight = null;
    });
    return this.syncInFlight;
  }

  private emptyStats(): CreativeModelCatalogSyncStats {
    return {
      modality: 'all',
      addedModelIds: [],
      updatedModelIds: [],
      removedModelIds: [],
      deprecatedModelIds: [],
      fetchedAt: new Date().toISOString(),
      catalogSize: 0,
    };
  }

  private async runSync(): Promise<CreativeModelCatalogSyncStats> {
    const stats: CreativeModelCatalogSyncStats = {
      modality: 'all',
      addedModelIds: [],
      updatedModelIds: [],
      removedModelIds: [],
      deprecatedModelIds: [],
      fetchedAt: new Date().toISOString(),
      catalogSize: 0,
    };
    const nextEntries: Partial<Record<CreativeModelModality, CreativeModelDefinition[]>> = {};
    const failures: string[] = [];
    let failedModalities = 0;
    // One creation type's failing query must not blank the other creation
    // types' lists: a failed modality keeps its previous entries and reports
    // its error, and the sync only fails when every modality failed.
    for (const modality of REMOTE_SYNC_MODALITIES) {
      try {
        const snapshot = await this.fetchRemoteModality(modality);
        const applied = this.applyRemoteSnapshot(modality, snapshot);
        nextEntries[modality] = applied.entries;
        stats.addedModelIds.push(...applied.addedModelIds);
        stats.updatedModelIds.push(...applied.updatedModelIds);
        stats.removedModelIds.push(...applied.removedModelIds);
        stats.deprecatedModelIds.push(...applied.deprecatedModelIds);
      } catch (error) {
        failedModalities += 1;
        failures.push(`${modality}: ${error instanceof Error ? error.message : String(error)}`);
        const previous = this.remoteLayer.entries[modality];
        if (previous !== undefined) nextEntries[modality] = previous;
      }
    }
    // The runtime video profiles are an enhancement over each model's known
    // baseline: a profile fetch failure keeps the static/fallback parameters
    // instead of blanking the video list.
    try {
      this.videoProfilesByKey = await this.fetchVideoProfiles();
    } catch (error) {
      this.videoProfilesByKey = new Map();
      failures.push(`video_profiles: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (failedModalities === REMOTE_SYNC_MODALITIES.length && REMOTE_SYNC_MODALITIES.length > 0) {
      this.syncState = {
        ...this.syncState,
        status: 'error',
        lastError: failures.join('; '),
      };
      this.notify();
      throw new Error(`creative model catalog sync failed: ${failures.join('; ')}`);
    }
    this.remoteLayer = {
      version: REMOTE_LAYER_VERSION,
      syncedAt: stats.fetchedAt,
      entries: nextEntries,
    };
    writeJsonStorage(REMOTE_LAYER_STORAGE_KEY, this.remoteLayer);
    stats.catalogSize = REMOTE_SYNC_MODALITIES.reduce(
      (total, modality) => total + this.getModels(modality).length,
      0,
    );
    this.syncState = {
      status: 'ready',
      lastSyncedAt: stats.fetchedAt,
      lastError: failures.length > 0 ? failures.join('; ') : null,
      lastStats: stats,
    };
    this.notify();
    return stats;
  }

  private async fetchRemoteModality(modality: CreativeModelModality): Promise<RemoteCreativeModelItem[]> {
    const profile = CREATIVE_MODEL_SELECTION_PROFILES[modality];
    if (!profile) return [];
    const { getModelsAppSdkClientWithSession } = await import('@sdkwork/agents-pc-core/sdk/modelsAppSdkClient');
    const client = getModelsAppSdkClientWithSession();
    // Ask the catalog for models that *produce* this creation type. The
    // capability filter is the primary scope (the catalog's own `modalities`
    // field unions input and output modalities, so a modality-only query also
    // returns chat models that merely read this media); the output-modality
    // query narrows further and `isCreationModel` drops anything the server
    // could not scope.
    const modalities = [...profile.outputModalities];
    const capabilities = [...profile.queryCapabilities];
    const items: RemoteCreativeModelItem[] = [];
    for (let page = 1; page <= MAX_REMOTE_PAGES; page += 1) {
      const response = await client.ai.models.list({
        ...(modalities.length > 0 ? { modalities } : {}),
        ...(capabilities.length > 0 ? { capabilities } : {}),
        page,
        pageSize: REMOTE_PAGE_SIZE,
      });
      items.push(...response.items);
      if (!response.pageInfo?.hasMore) break;
    }
    return items;
  }

  /**
   * Load the catalog's authoritative video generation profiles.
   *
   * Profiles are keyed by model catalog key (`vendor/modelId`); the app API
   * returns each profile with its full catalog key (`vendor/model/profile`),
   * so the last segment is dropped. The response type mirrors the shared page
   * envelope rather than a generated profile type, hence the structural read.
   */
  private async fetchVideoProfiles(): Promise<Map<string, CatalogVideoProfile[]>> {
    const { getModelsAppSdkClientWithSession } = await import('@sdkwork/agents-pc-core/sdk/modelsAppSdkClient');
    const client = getModelsAppSdkClientWithSession();
    const response = await client.ai.videoProfiles.list({});
    const items = (response as unknown as { items?: unknown }).items;
    if (!Array.isArray(items)) return new Map();
    const byKey = new Map<string, CatalogVideoProfile[]>();
    for (const raw of items) {
      if (raw === null || typeof raw !== 'object') continue;
      const profile = raw as {
        catalogKey?: unknown;
        generationMode?: unknown;
        aspectRatios?: unknown;
        resolution?: unknown;
        outputAudio?: unknown;
        durationPolicy?: unknown;
        durationOptions?: unknown;
        minDurationSeconds?: unknown;
        maxDurationSeconds?: unknown;
        durationStepSeconds?: unknown;
        durationSeconds?: unknown;
        isDefault?: unknown;
      };
      if (typeof profile.catalogKey !== 'string' || typeof profile.generationMode !== 'string') continue;
      const segments = profile.catalogKey.split('/');
      if (segments.length < 3) continue;
      const modelKey = `${segments[0]}/${segments[1]}`.toLowerCase();
      const entry: CatalogVideoProfile = {
        generationMode: profile.generationMode,
        aspectRatios: Array.isArray(profile.aspectRatios)
          ? profile.aspectRatios.filter((value): value is string => typeof value === 'string')
          : [],
        resolution: typeof profile.resolution === 'string' ? profile.resolution : null,
        outputAudio: typeof profile.outputAudio === 'boolean' ? profile.outputAudio : null,
        durationPolicy: typeof profile.durationPolicy === 'string' ? profile.durationPolicy : null,
        durationOptions: Array.isArray(profile.durationOptions)
          ? profile.durationOptions.filter((value): value is number => typeof value === 'number')
          : [],
        minDurationSeconds: typeof profile.minDurationSeconds === 'number' ? profile.minDurationSeconds : null,
        maxDurationSeconds: typeof profile.maxDurationSeconds === 'number' ? profile.maxDurationSeconds : null,
        durationStepSeconds: typeof profile.durationStepSeconds === 'number' ? profile.durationStepSeconds : null,
        durationSeconds: typeof profile.durationSeconds === 'number' ? profile.durationSeconds : null,
        isDefault: profile.isDefault === true,
      };
      const list = byKey.get(modelKey) ?? [];
      list.push(entry);
      byKey.set(modelKey, list);
    }
    return byKey;
  }

  /**
   * Diff one modality snapshot against the current remote layer. The
   * snapshot is authoritative for remote-managed entries: missing ids are
   * removed, new ids are added, changed fields are updated, and entries that
   * became deprecated/retired are reported so callers can migrate stale
   * selections (resolveSelection handles the actual fallback).
   */
  private applyRemoteSnapshot(
    modality: CreativeModelModality,
    snapshot: RemoteCreativeModelItem[],
  ): {
    entries: CreativeModelDefinition[];
    addedModelIds: string[];
    updatedModelIds: string[];
    removedModelIds: string[];
    deprecatedModelIds: string[];
  } {
    const previous = this.remoteLayer.entries[modality] ?? [];
    const previousById = new Map(previous.map((definition) => [definition.id, definition]));
    const staticIds = new Set(STATIC_CREATIVE_MODELS[modality].map((definition) => definition.id));
    const snapshotById = new Map<string, CreativeModelDefinition>();

    const entries: CreativeModelDefinition[] = [];
    const addedModelIds: string[] = [];
    const updatedModelIds: string[] = [];
    const removedModelIds: string[] = [];
    const deprecatedModelIds: string[] = [];

    snapshot.forEach((item) => {
      // Hidden models are dropped from the catalog entirely; archived
      // entries stay as retired so stale selections can be migrated.
      if (item.shelfState === CREATIVE_MODEL_SHELF_STATE.HIDDEN) return;
      // A row that does not belong to this creation type never enters the
      // layer: it would render in the picker and then fail at dispatch.
      if (!isCreationModel(modality, item)) return;
      const definition = toRemoteDefinition(item, modality, entries.length, staticIds);
      snapshotById.set(definition.id, definition);

      const before = previousById.get(definition.id);
      if (!before && !staticIds.has(definition.id) && definition.lifecycle !== 'retired') {
        addedModelIds.push(definition.id);
      }
      if (before && !definitionsEqual(before, definition)) {
        updatedModelIds.push(definition.id);
      }
      const becameDeprecated = (definition.lifecycle === 'deprecated' || definition.lifecycle === 'retired')
        && (!before || (before.lifecycle !== 'deprecated' && before.lifecycle !== 'retired'));
      if (becameDeprecated) deprecatedModelIds.push(definition.id);
      entries.push(definition);
    });

    for (const definition of previous) {
      if (!snapshotById.has(definition.id)) {
        removedModelIds.push(definition.id);
      }
    }

    return { entries, addedModelIds, updatedModelIds, removedModelIds, deprecatedModelIds };
  }

  /** Clear the remote layer and persisted selections (settings/test reset). */
  reset(): void {
    this.remoteLayer = { version: REMOTE_LAYER_VERSION, syncedAt: '', entries: {} };
    this.videoProfilesByKey = new Map();
    this.selectedIds = {};
    try {
      window.localStorage.removeItem(REMOTE_LAYER_STORAGE_KEY);
      window.localStorage.removeItem(SELECTED_MODELS_STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
    this.syncState = { status: 'idle', lastSyncedAt: null, lastError: null, lastStats: null };
    this.notify();
  }
}

export const creativeModelCatalogService = new CreativeModelCatalogService();

export { isCreativeModelModality };
