/**
 * Unified creative model catalog contracts shared by the image generation,
 * inspiration and video generation creation modes.
 *
 * Data layering (high cohesion, low coupling):
 * - `static`: baseline catalog seeded from the `sdkwork-models` repository
 *   static catalog. Always available, works offline.
 * - `remote`: authoritative snapshot fetched from the models app API
 *   (`GET /app/v3/api/ai/models?modalities=...`). Remote entries are added,
 *   updated, removed and deprecated through the sync service; static entries
 *   stay as the offline fallback unless the remote explicitly deprecates them.
 */

export type CreativeModelModality =
  | 'image'
  | 'video'
  | 'music'
  | 'voice'
  | 'sound_effects'
  | 'digital_human'
  | 'action';

export type CreativeModelLifecycle = 'active' | 'preview' | 'deprecated' | 'retired';

export type CreativeModelSource = 'static' | 'remote';

/**
 * How one creation type selects its model from the sdkwork-models catalog.
 *
 * `capability` is the catalog capability a listed row must declare and
 * `outputModalities` are the modalities it must produce: together they scope
 * the list to models *producing* this creation type (the catalog's own
 * `modalities` field unions input and output, so an input modality alone would
 * also match a model that merely accepts this media). `vendorCodes` keeps only
 * catalog vendor codes the generations provider adapter can dispatch.
 */
export interface CreativeModelSelectionProfile {
  /**
   * Catalog capability a listed row must declare; `null` accepts any.
   *
   * `capabilities` and `queryCapabilities` differ where the capability code
   * collides on the wire (sound effects share the music code), so the query is
   * left broad and the client filters that type itself.
   */
  readonly capability: string | null;
  /** `capabilities` filter values; empty leaves the query unfiltered. */
  readonly queryCapabilities: readonly string[];
  /** Output modalities the model must produce. */
  readonly outputModalities: readonly string[];
  /** Catalog vendor codes the generations provider adapter dispatches. */
  readonly vendorCodes: readonly string[];
  /**
   * Model-id tokens that disqualify a row. Realtime voice models declare the
   * `audio` capability like speech models, but the generation plane only wires
   * text-to-speech surfaces.
   */
  readonly excludedModelIdTokens: readonly string[];
}

/** Duration control a model accepts. */
export interface CreativeModelDuration {
  /** Lowest accepted seconds. */
  minSeconds: number;
  /** Highest accepted seconds. */
  maxSeconds: number;
  /** Accepted increment; 1 when any integer is valid. */
  stepSeconds: number;
  /** Discrete accepted values (fixed/discrete vendor policies); empty for ranges. */
  values: readonly number[];
  /** Default seconds the picker starts at. */
  defaultSeconds: number;
}

/** Video generation knobs a catalog model actually accepts. */
export interface CreativeModelVideoParameters {
  /** Generation modes the generations adapter can dispatch for this model. */
  generationModes: readonly string[];
  aspectRatios: readonly string[];
  /** Catalog resolutions, lowercase (`480p` ... `4k`). */
  resolutions: readonly string[];
  /** Accepted durations; `null` when the vendor decides and no knob applies. */
  duration: CreativeModelDuration | null;
  /** Whether the vendor returns synchronized audio. */
  outputAudio: boolean;
}

/** Image generation knobs a catalog model actually accepts. */
export interface CreativeModelImageParameters {
  aspectRatios: readonly string[];
  /** Resolution tiers the model's vendor accepts (`1K`, `2K`, `4K`). */
  resolutions: readonly string[];
  /** Whether free-form pixel width/height is accepted. */
  customSize: boolean;
  /** Maximum images per command the vendor accepts. */
  maxCount: number;
}

/** Music generation knobs. */
export interface CreativeModelMusicParameters {
  /** Duration control; `null` when the vendor decides the length. */
  duration: CreativeModelDuration | null;
  /** Whether the vendor can choose a length itself ("智能时长"). */
  smartDuration: boolean;
}

/** One selectable voice for a speech model. */
export interface CreativeModelVoiceOption {
  /** Vendor voice id sent on the command (`voice` / `voiceId`). */
  id: string;
  label: string;
}

/** Speech synthesis knobs. */
export interface CreativeModelVoiceParameters {
  voices: readonly CreativeModelVoiceOption[];
}

/** Sound-effect knobs. */
export interface CreativeModelSfxParameters {
  duration: CreativeModelDuration | null;
  supportsLoop: boolean;
}

/** Every parameter facet a creative model may declare. */
export interface CreativeModelParameters {
  video?: CreativeModelVideoParameters;
  image?: CreativeModelImageParameters;
  music?: CreativeModelMusicParameters;
  voice?: CreativeModelVoiceParameters;
  sound_effects?: CreativeModelSfxParameters;
}

/** One public reference price row of a model. */
export interface CreativeModelReferencePrice {
  /** Catalog billing region (`cn`, `global`). */
  regionCode: string
  /** Billing meter code (`video_output_second`, `image_result`, ...). */
  meterCode: string
  /** Price the meter unit costs, as a decimal string. */
  unitPrice: string
  /** Currency code (`CNY`, `USD`). */
  currency: string
}

export interface CreativeModelDefinition {
  /** Stable model id submitted with generation commands. */
  id: string;
  modality: CreativeModelModality;
  label: string;
  desc: string;
  /** Member-exclusive highlight marker. */
  spark?: boolean;
  /** Cover image URL for avatar-style pickers. */
  image?: string;
  /** Big badge text for version-style pickers. */
  badge?: string;
  subBadge?: string;
  isNew?: boolean;
  lifecycle: CreativeModelLifecycle;
  /** Preferred replacement when this model is deprecated or retired. */
  replacementModelId?: string | null;
  /**
   * Catalog vendor code (`kuaishou`, `bytedance`, ...). Generation commands
   * forward it as `parameters.vendor` so the backend dispatches to the right
   * vendor adapter instead of the modality default.
   */
  vendorCode?: string | null;
  /** Per-model parameter support the picker must constrain itself to. */
  parameters?: CreativeModelParameters;
  /** Public official reference prices the catalog publishes for this model. */
  referencePrices?: readonly CreativeModelReferencePrice[];
  /** Catalog family code (`seedance`, `kling`, ...). */
  familyCode?: string;
  /** Brand color token (hex) the catalog publishes for the model. */
  colorToken?: string;
  /** Vendor documentation URL for the model. */
  docsUrl?: string;
  source: CreativeModelSource;
  /** Display order hint; static entries keep catalog order, remote entries follow server order. */
  order: number;
}

export interface CreativeModelCatalogSyncStats {
  modality: CreativeModelModality | 'all';
  addedModelIds: string[];
  updatedModelIds: string[];
  removedModelIds: string[];
  deprecatedModelIds: string[];
  fetchedAt: string;
  /** Total picker-visible definitions after the sync was applied. */
  catalogSize: number;
}

export type CreativeModelCatalogSyncStatus = 'idle' | 'syncing' | 'ready' | 'error';

export interface CreativeModelCatalogSyncState {
  status: CreativeModelCatalogSyncStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
  lastStats: CreativeModelCatalogSyncStats | null;
}

/**
 * Subset of the wire contract (`AppModelCatalogItem`) the client mapper
 * consumes. Kept structural so the service never imports the generated SDK
 * types directly and stays decoupled from the transport layer.
 */
export interface RemoteCreativeModelItem {
  model: string;
  displayName: string;
  vendorCode: string;
  description: string | null;
  capabilityIntro?: string | null;
  /**
   * Union of the model's input and output modalities. Kept for display and as
   * a last-resort match; creation filtering uses `outputModalities` so a model
   * that merely *accepts* a video cannot list under video generation.
   */
  modalities: string[];
  /** Modalities the model produces (absent on older app API responses). */
  outputModalities?: string[];
  /** Capability codes the catalog declares (`video`, `image`, `chat`, ...). */
  capabilities?: string[];
  /** Public official reference prices (absent on older responses). */
  officialReferencePrices?: {
    regionCode: string;
    billingMeter: string;
    unitPrice: string;
    currency: string;
  }[];
  /** Whether a public reference price exists for this model. */
  priceAvailability?: { status: string; reason?: string | null };
  /** Catalog model family code (`seedance`, `kling`, ...). */
  familyCode?: string | null;
  /** Brand color token (hex) the catalog publishes for the model. */
  colorToken?: string | null;
  /** Vendor documentation URL for the model. */
  docsUrl?: string | null;
  /** Number of catalog video generation profiles the model declares. */
  videoProfileCount?: number;
  /** Number of voice bindings the model declares. */
  voiceBindingCount?: number;
  releaseStage: number | null;
  shelfState: number | null;
  routingState: number | null;
  replacementModel: string | null;
}

/** Wire enum mapping used by sdkwork-models (`model_catalog_import.rs`). */
export const CREATIVE_MODEL_RELEASE_STAGE = {
  ACTIVE: 1,
  PREVIEW: 2,
  DEPRECATED: 3,
  RETIRED: 4,
} as const;

export const CREATIVE_MODEL_SHELF_STATE = {
  LISTED: 1,
  HIDDEN: 2,
  ARCHIVED: 3,
} as const;
