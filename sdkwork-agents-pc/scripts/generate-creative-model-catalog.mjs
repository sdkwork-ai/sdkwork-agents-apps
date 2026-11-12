/**
 * Project the sibling `sdkwork-models` catalog into this app's static creative
 * model catalog (`packages/sdkwork-agents-pc-commons/.../staticCreativeModelCatalog.ts`).
 *
 * The creative surface picks a model per creation type and submits its
 * sdkwork-models `modelId` plus `vendorCode` to the generations command plane.
 * That only works when every listed entry is a real catalog model owned by a
 * vendor the generations provider adapter can dispatch, so the list is derived
 * from the catalog instead of hand-kept.
 *
 * Each entry also carries the parameter support the picker must respect:
 * - video: catalog `model-video-profiles` (generation modes, ratios, resolution
 *   tiers, duration policy, audio) intersected with the modes the generations
 *   provider adapter can actually dispatch for that vendor;
 * - image / music / voice / sound effects: the vendor surface policy below,
 *   which mirrors the adapter's request mapping (`sdkwork-generations`
 *   `crates/...-provider-adapter`).
 *
 * Regenerate after a catalog bump:
 *
 *   node scripts/generate-creative-model-catalog.mjs
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const modelsRoot = process.env.SDKWORK_MODELS_ROOT
  ?? resolve(appRoot, '..', '..', '..', 'sdkwork-models', 'models')
const target = join(
  appRoot,
  'packages',
  'sdkwork-agents-pc-commons',
  'src',
  'creative-model-catalog',
  'staticCreativeModelCatalog.ts',
)

/**
 * One creation type's catalog selection rule.
 *
 * `capability` is the catalog capability a listed row must declare;
 * `queryCapabilities` is the same value as the app API `capabilities` filter
 * (empty when the capability code would also match a sibling type, so the
 * client filters that type itself); `outputModalities` are the modalities the
 * model must produce; `vendorCodes` are the catalog vendor codes the
 * generations provider adapter can dispatch.
 */
const PROFILES = {
  image: {
    capability: 'image',
    queryCapabilities: ['image'],
    outputModalities: ['image'],
    vendorCodes: ['openai', 'google', 'kuaishou', 'vidu', 'bytedance'],
    excludedModelIdTokens: [],
  },
  video: {
    capability: 'video',
    queryCapabilities: ['video'],
    outputModalities: ['video'],
    vendorCodes: ['openai', 'google', 'kuaishou', 'vidu', 'bytedance'],
    excludedModelIdTokens: [],
  },
  music: {
    capability: 'music',
    queryCapabilities: ['music'],
    outputModalities: ['music'],
    vendorCodes: ['suno', 'minimax'],
    excludedModelIdTokens: [],
  },
  voice: {
    capability: 'audio',
    queryCapabilities: ['audio'],
    outputModalities: ['audio'],
    vendorCodes: ['elevenlabs', 'bytedance'],
    // Realtime voice agents declare the `audio` capability but the generation
    // plane only wires text-to-speech surfaces.
    excludedModelIdTokens: ['realtime'],
  },
  sound_effects: {
    capability: 'sfx',
    // `sfx` shares the `music` capability code on the wire, so the query stays
    // unfiltered and the client keeps only the sound-effect models.
    queryCapabilities: [],
    outputModalities: ['audio'],
    vendorCodes: ['elevenlabs'],
    excludedModelIdTokens: [],
  },
}

/**
 * Video generation modes the generations provider adapter dispatches per
 * vendor surface for the composer's video creation type. Avatar and
 * motion-mimicry models belong to the digital-human / action creation types,
 * not to the video picker.
 */
const ADAPTER_VIDEO_MODES = {
  openai: ['text_to_video', 'image_to_video'],
  google: ['text_to_video'],
  kuaishou: ['text_to_video', 'image_to_video', 'start_end_frame'],
  vidu: ['text_to_video', 'image_to_video', 'reference_to_video', 'start_end_frame'],
  bytedance: ['text_to_video', 'image_to_video', 'reference_to_video', 'start_end_frame'],
}

/** Canonical display order for video generation modes. */
const VIDEO_MODE_ORDER = [
  'text_to_video',
  'image_to_video',
  'reference_to_video',
  'start_end_frame',
  'multi_shot',
  'avatar',
  'motion_control',
]

/** Canonical aspect-ratio order (wide to tall). */
const ASPECT_RATIO_ORDER = ['21:9', '16:9', '3:2', '4:3', '1:1', '3:4', '2:3', '9:16']

/** Resolution tier order used to sort the picker rows. */
const RESOLUTION_RANK = {
  '480p': 1,
  '540p': 2,
  '720p': 3,
  '768p': 4,
  '1080p': 5,
  '2k': 6,
  '4k': 7,
}

/**
 * Image parameter policy per vendor surface.
 *
 * `resolutions` lists the tiers the adapter transmits (or that the vendor's
 * fixed output matches); `customSize` marks vendors whose surface accepts an
 * explicit `WIDTHxHEIGHT`; `maxCount` is the per-command image limit.
 */
const IMAGE_POLICIES = {
  openai: {
    aspectRatios: ['1:1', '3:2', '2:3', '16:9', '9:16'],
    resolutions: ['1K', '2K', '4K'],
    customSize: true,
    maxCount: 4,
  },
  bytedance: {
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
    resolutions: ['1K', '2K', '4K'],
    customSize: true,
    maxCount: 4,
  },
  kuaishou: {
    // Kling images take an aspect ratio only; the surface exposes no size tier.
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
    resolutions: ['1K'],
    customSize: false,
    maxCount: 1,
  },
  vidu: {
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    resolutions: ['1K', '2K', '4K'],
    customSize: false,
    maxCount: 1,
  },
  google: {
    // Gemini images take an aspect ratio plus a sample count.
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
    resolutions: ['1K'],
    customSize: false,
    maxCount: 4,
  },
}

/** Music parameter policy per vendor surface. */
const MUSIC_POLICIES = {
  suno: {
    duration: { minSeconds: 5, maxSeconds: 300, stepSeconds: 5, values: [], defaultSeconds: 120 },
    smartDuration: true,
  },
  // MiniMax music takes lyrics/prompt only; the vendor decides the length.
  minimax: { duration: null, smartDuration: false },
}

/**
 * Speech voices offered per vendor surface. The catalog voice lists are
 * dynamic (`_catalog_dynamic`: use any vendor-library voice), so the picker
 * offers the vendors' documented public voices and still lets the vendor apply
 * its default when the list is empty.
 */
const VOICE_POLICIES = {
  elevenlabs: {
    voices: [
      { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel（女声）' },
      { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella（女声）' },
      { id: 'AZnzlk1XvdvUeBnXmlld', label: 'Domi（女声）' },
      { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam（男声）' },
    ],
  },
  bytedance: {
    voices: [
      { id: 'zh_female_cancan_mars', label: '灿灿（女声）' },
    ],
  },
}

/** Sound-effect parameter policy per vendor surface. */
const SFX_POLICIES = {
  // ElevenLabs sound generation: 0.5–22 seconds.
  elevenlabs: {
    duration: { minSeconds: 0.5, maxSeconds: 22, stepSeconds: 0.5, values: [], defaultSeconds: 4 },
    supportsLoop: true,
  },
}

/**
 * Conservative video modes for a catalog model the static baseline does not
 * carry yet: only the two modes every wired video vendor surface supports, so
 * the remote sync can list a newly published model without offering a surface
 * its vendor cannot dispatch.
 */
const VENDOR_VIDEO_FALLBACK_MODES = {
  openai: ['text_to_video', 'image_to_video'],
  google: ['text_to_video'],
  kuaishou: ['text_to_video', 'image_to_video'],
  vidu: ['text_to_video', 'image_to_video'],
  bytedance: ['text_to_video', 'image_to_video'],
}

/**
 * Creation types whose model list is static-only: the catalog publishes no
 * models for the Kling digital-human / motion-mimicry surfaces.
 */
const CURATED = {
  digital_human: [
    { id: 'master_mode', label: '大师模式', desc: '电影级的表演效果', spark: true },
    { id: 'fast_mode', label: '快速模式', desc: '更低成本，快速生成' },
    { id: 'basic_mode', label: '基础模式', desc: '仅仅修改人物口型。适合演讲、对白' },
  ],
  action: [
    { id: 'master', label: '大师', desc: '效果最佳，画质超清', spark: true, isNew: true },
    { id: 'vivid', label: '生动', desc: '不限画幅，动效更真', isNew: true },
    { id: 'fast', label: '快速', desc: '更快生成，成本更低', isNew: true },
  ],
}

/** Vendors the curated Kling surfaces dispatch through. */
const CURATED_VENDOR = 'kling'

const MODALITY_ORDER = ['image', 'video', 'music', 'voice', 'sound_effects', 'digital_human', 'action']

const STATIC_SYMBOL = {
  image: 'STATIC_IMAGE_MODELS',
  video: 'STATIC_VIDEO_MODELS',
  music: 'STATIC_MUSIC_MODELS',
  voice: 'STATIC_VOICE_MODELS',
  sound_effects: 'STATIC_SOUND_EFFECT_MODELS',
  digital_human: 'STATIC_DIGITAL_HUMAN_MODELS',
  action: 'STATIC_ACTION_MODELS',
}

/** Lifecycle stages a creation picker may offer. */
const SELECTABLE_LIFECYCLE = new Set(['active', 'preview'])

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Every catalog model row across every `<vendor>/<region>/models` directory. */
function catalogModels() {
  const rows = []
  for (const vendor of readdirSync(modelsRoot, { withFileTypes: true })) {
    if (!vendor.isDirectory()) continue
    const vendorRoot = join(modelsRoot, vendor.name)
    for (const region of readdirSync(vendorRoot, { withFileTypes: true })) {
      if (!region.isDirectory()) continue
      const modelsDir = join(vendorRoot, region.name, 'models')
      if (!existsSync(modelsDir)) continue
      for (const file of readdirSync(modelsDir)) {
        if (!file.endsWith('.json')) continue
        rows.push(readJson(join(modelsDir, file)))
      }
    }
  }
  return rows
}

/** `vendor/modelId` → catalog video profiles for that model. */
function catalogVideoProfiles() {
  const index = new Map()
  for (const vendor of readdirSync(modelsRoot, { withFileTypes: true })) {
    if (!vendor.isDirectory()) continue
    const vendorRoot = join(modelsRoot, vendor.name)
    for (const region of readdirSync(vendorRoot, { withFileTypes: true })) {
      if (!region.isDirectory()) continue
      const profilesDir = join(vendorRoot, region.name, 'model-video-profiles')
      if (!existsSync(profilesDir)) continue
      for (const file of readdirSync(profilesDir)) {
        if (!file.endsWith('.json')) continue
        const row = readJson(join(profilesDir, file))
        index.set(`${row.vendorCode}/${row.modelId}`, row.profiles ?? [])
      }
    }
  }
  return index
}

/** Stable unique list preserving the canonical order of known values. */
function orderedUnique(values, order) {
  const unique = [...new Set(values.filter((value) => typeof value === 'string' && value.trim() !== ''))]
  return unique.sort((left, right) => {
    const leftIndex = order.indexOf(left)
    const rightIndex = order.indexOf(right)
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right)
    if (leftIndex === -1) return 1
    if (rightIndex === -1) return -1
    return leftIndex - rightIndex
  })
}

function sortedResolutions(values) {
  const unique = [...new Set(values.map((value) => String(value).toLowerCase()).filter(Boolean))]
  return unique.sort((left, right) => (RESOLUTION_RANK[left] ?? 99) - (RESOLUTION_RANK[right] ?? 99))
}

/**
 * Per-model video parameter profile: the catalog's modes narrowed to what the
 * adapter dispatches, plus the union of the accepted ratios, resolutions and
 * duration/policy across the model's catalog profiles.
 */
function videoParameters(vendorCode, profiles) {
  if (!profiles || profiles.length === 0) return undefined
  const supported = ADAPTER_VIDEO_MODES[vendorCode] ?? []
  const generationModes = orderedUnique(
    profiles.map((profile) => profile.generationMode).filter((mode) => supported.includes(mode)),
    VIDEO_MODE_ORDER,
  )
  if (generationModes.length === 0) return undefined

  const aspectRatios = orderedUnique(
    profiles.flatMap((profile) => profile.aspectRatios ?? []),
    ASPECT_RATIO_ORDER,
  )
  const resolutions = sortedResolutions(
    profiles.map((profile) => profile.resolution).filter(Boolean),
  )

  const ranges = profiles.filter((profile) => (
    Number.isFinite(profile.minDurationSeconds) && Number.isFinite(profile.maxDurationSeconds)
  ))
  const fixed = profiles
    .map((profile) => profile.durationSeconds)
    .filter((value) => Number.isFinite(value))
  let duration
  if (ranges.length > 0) {
    const minSeconds = Math.min(...ranges.map((profile) => profile.minDurationSeconds))
    const maxSeconds = Math.max(...ranges.map((profile) => profile.maxDurationSeconds))
    const stepSeconds = Math.max(1, Math.min(...ranges.map((profile) => profile.durationStepSeconds ?? 1)))
    const defaultProfile = profiles.find((profile) => profile.isDefault === true) ?? ranges[0]
    const defaultSeconds = Math.min(
      maxSeconds,
      Math.max(minSeconds, Number(defaultProfile.minDurationSeconds ?? minSeconds)),
    )
    duration = { minSeconds, maxSeconds, stepSeconds, values: [], defaultSeconds }
  } else if (fixed.length > 0) {
    const values = [...new Set(fixed)].sort((left, right) => left - right)
    duration = {
      minSeconds: values[0],
      maxSeconds: values[values.length - 1],
      stepSeconds: values.length > 1 ? values[1] - values[0] : 1,
      values,
      defaultSeconds: values[0],
    }
  } else {
    duration = null
  }

  return {
    generationModes,
    aspectRatios,
    resolutions,
    duration,
    outputAudio: profiles.some((profile) => profile.outputAudio === true),
  }
}

/** Per-model parameter facets emitted into the static catalog entry. */
function parametersFor(modality, model, videoProfiles) {
  if (modality === 'video') {
    const video = videoParameters(model.vendorCode, videoProfiles.get(`${model.vendorCode}/${model.modelId}`))
    return video === undefined ? undefined : { video }
  }
  if (modality === 'image') {
    const image = IMAGE_POLICIES[model.vendorCode]
    return image === undefined ? undefined : { image }
  }
  if (modality === 'music') {
    const music = MUSIC_POLICIES[model.vendorCode]
    return music === undefined ? undefined : { music }
  }
  if (modality === 'voice') {
    const voice = VOICE_POLICIES[model.vendorCode]
    return voice === undefined ? undefined : { voice }
  }
  if (modality === 'sound_effects') {
    const sound = SFX_POLICIES[model.vendorCode]
    return sound === undefined ? undefined : { sound_effects: sound }
  }
  return undefined
}

/**
 * Catalog models the generation backend can dispatch for one creation type.
 *
 * `listed` mirrors the app catalog's own public filter (listed + routable), so
 * the static baseline and the remote sync see the same model population.
 */
function modelsFor(modality, rows) {
  const profile = PROFILES[modality]
  const matched = rows.filter((model) => (
    model.primaryCapability === profile.capability
    && profile.vendorCodes.includes(model.vendorCode)
    && SELECTABLE_LIFECYCLE.has(model.lifecycle)
    && model.shelfState === 'listed'
    && model.routingState === 'enabled'
    && !profile.excludedModelIdTokens.some((token) => model.modelId.toLowerCase().includes(token))
    && (model.outputModalities ?? []).some((value) => profile.outputModalities.includes(value))
  ))
  return dedupe(matched)
}

/**
 * The music surfaces (Suno, MiniMax) are catalog-only: the models catalog
 * records them without routing because it publishes no per-generation API
 * price, while the generations adapter dispatches them through the Cloud Router
 * vendor endpoints. Keep the newest non-retired row per model id.
 */
function catalogOnlyMusicModels(rows) {
  const profile = PROFILES.music
  const matched = rows.filter((model) => (
    model.primaryCapability === profile.capability
    && profile.vendorCodes.includes(model.vendorCode)
    && model.lifecycle !== 'retired'
    && model.lifecycle !== 'deprecated'
    && (model.outputModalities ?? []).some((value) => profile.outputModalities.includes(value))
  ))
  return dedupe(matched)
}

/**
 * TTS-capable models are the ones the catalog publishes a voice list for
 * (`<vendor>/<region>/model-voices/<modelId>.json`): speech models that only
 * expose a raw synthesis endpoint carry no voice file.
 */
function voiceModels(rows) {
  const withVoiceLists = rows.filter((model) => (
    existsSync(join(modelsRoot, model.vendorCode, model.regionCode, 'model-voices', `${model.modelId}.json`))
  ))
  return modelsFor('voice', withVoiceLists)
}

/** One row per `<vendor>/<modelId>`, preferring the `cn` region then the rank. */
function dedupe(rows) {
  const byKey = new Map()
  for (const row of rows) {
    const key = `${row.vendorCode}/${row.modelId}`
    const existing = byKey.get(key)
    if (existing === undefined) {
      byKey.set(key, row)
      continue
    }
    const existingCn = existing.regionCode === 'cn'
    const candidateCn = row.regionCode === 'cn'
    if ((candidateCn && !existingCn)
      || (candidateCn === existingCn && Number(row.rankScore ?? 0) > Number(existing.rankScore ?? 0))) {
      byKey.set(key, row)
    }
  }
  return [...byKey.values()].sort((left, right) => (
    Number(right.rankScore ?? 0) - Number(left.rankScore ?? 0)
    || left.displayName.localeCompare(right.displayName)
  ))
}

/** Single-quoted TypeScript literal, escaped through JSON. */
function js(value) {
  const json = JSON.stringify(value)
  return `'${json.slice(1, -1).replaceAll('\'', '\\\'')}'`
}

/** Collapse a catalog description into one display line. */
function descriptionOf(model) {
  const text = (model.description ?? '').replace(/\s+/gu, ' ').trim()
  if (text.length <= 160) return text
  return `${text.slice(0, 157)}...`
}

/** Render a JSON-compatible value as single-quoted TypeScript. */
function jsValue(value, indent = '      ') {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return js(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const scalar = value.every((entry) => typeof entry !== 'object' || entry === null)
    if (scalar) return `[${value.map((entry) => jsValue(entry, indent)).join(', ')}]`
    return `[\n${value.map((entry) => `${indent}  ${jsValue(entry, indent + '  ')}`).join(',\n')}\n${indent}]`
  }
  const entries = Object.entries(value)
  if (entries.length === 0) return '{}'
  return `{\n${entries
    .map(([key, entry]) => `${indent}  ${key}: ${jsValue(entry, indent + '  ')}`)
    .join(',\n')}\n${indent}}`
}

function renderCatalogModel(modality, model, order, videoProfiles) {
  const flags = [
    model.releaseStage === 'preview' ? "lifecycle: 'preview'" : undefined,
    model.releaseStage === 'preview' ? 'isNew: true' : undefined,
  ].filter((line) => line !== undefined)
  const parameters = parametersFor(modality, model, videoProfiles)
  return [
    '  staticModel(',
    `    ${js(modality)},`,
    `    ${order},`,
    '    {',
    `      id: ${js(model.modelId)},`,
    `      label: ${js(model.displayName)},`,
    `      desc: ${js(descriptionOf(model))},`,
    `      vendorCode: ${js(model.vendorCode)},`,
    ...flags.map((line) => `      ${line},`),
    ...(parameters === undefined ? [] : [`      parameters: ${jsValue(parameters)},`]),
    '    },',
    '  ),',
  ].join('\n')
}

function renderCurated(modality) {
  return CURATED[modality].map((model, order) => [
    '  staticModel(',
    `    ${js(modality)},`,
    `    ${order},`,
    '    {',
    `      id: ${js(model.id)},`,
    `      label: ${js(model.label)},`,
    `      desc: ${js(model.desc)},`,
    `      vendorCode: ${js(CURATED_VENDOR)},`,
    ...(model.spark === true ? ['      spark: true,'] : []),
    ...(model.isNew === true ? ['      isNew: true,'] : []),
    '    },',
    '  ),',
  ].join('\n'))
}

function renderProfiles() {
  return MODALITY_ORDER.map((modality) => {
    const profile = PROFILES[modality]
    if (profile === undefined) return `  ${modality}: null,`
    return [
      `  ${modality}: {`,
      `    capability: ${js(profile.capability)},`,
      `    queryCapabilities: [${profile.queryCapabilities.map(js).join(', ')}],`,
      `    outputModalities: [${profile.outputModalities.map(js).join(', ')}],`,
      `    vendorCodes: [${profile.vendorCodes.map(js).join(', ')}],`,
      `    excludedModelIdTokens: [${profile.excludedModelIdTokens.map(js).join(', ')}],`,
      '  },',
    ].join('\n')
  }).join('\n')
}

function render(catalog, lists, videoProfiles) {
  const arrays = MODALITY_ORDER.map((modality) => {
    const body = PROFILES[modality] === undefined
      ? renderCurated(modality)
      : lists[modality].map((row, order) => renderCatalogModel(modality, row, order, videoProfiles))
    return [
      `export const ${STATIC_SYMBOL[modality]}: CreativeModelDefinition[] = [`,
      ...body,
      '];',
    ].join('\n')
  }).join('\n\n')

  const defaults = MODALITY_ORDER.map((modality) => {
    const first = lists[modality][0]
    const id = first.id ?? first.modelId
    return `  ${modality}: ${js(id)},`
  }).join('\n')

  return `/**
 * Static baseline catalog.
 *
 * Seeded from the \`sdkwork-models\` repository catalog (\`models/\` +
 * \`catalogVersion\`) and materialized at build time. This is the default data
 * source for every creation mode: it works offline and before the first remote
 * sync. The remote sync layer may add, update, deprecate or remove models on top
 * of this baseline (see creativeModelCatalogService).
 *
 * Every entry is a real catalog model plus the vendor code the generations
 * command plane forwards as \`parameters.vendor\`, and only vendors the provider
 * adapter can dispatch appear. \`parameters\` carries the knobs the model
 * accepts (video modes / ratios / resolutions / duration, image size tiers,
 * music length, speech voices, sound-effect length): the picker offers only
 * those values, and the command carries only what the selected model supports.
 *
 * Source: sdkwork-models catalog ${catalog.catalogVersion} (generatedAt ${catalog.generatedAt}).
 * Regenerate with \`node scripts/generate-creative-model-catalog.mjs\`; do not edit by hand.
 */
import type {
  CreativeModelDefinition,
  CreativeModelImageParameters,
  CreativeModelModality,
  CreativeModelMusicParameters,
  CreativeModelSelectionProfile,
  CreativeModelSfxParameters,
  CreativeModelVoiceParameters,
} from './creativeModelCatalogTypes';

export const STATIC_CREATIVE_MODEL_CATALOG_VERSION = ${js(catalog.catalogVersion)};

function staticModel(
  modality: CreativeModelModality,
  order: number,
  input: Omit<CreativeModelDefinition, 'modality' | 'lifecycle' | 'source' | 'order'> &
    Partial<Pick<CreativeModelDefinition, 'lifecycle'>>,
): CreativeModelDefinition {
  return {
    lifecycle: 'active',
    ...input,
    modality,
    source: 'static',
    order,
  };
}

${arrays}

export const STATIC_CREATIVE_MODELS: Readonly<
  Record<CreativeModelModality, readonly CreativeModelDefinition[]>
> = Object.freeze({
${MODALITY_ORDER.map((modality) => `  ${modality}: ${STATIC_SYMBOL[modality]},`).join('\n')}
});

/** Default selection per modality (first entry of each static catalog). */
export const STATIC_DEFAULT_MODEL_IDS: Readonly<
  Record<CreativeModelModality, string>
> = Object.freeze({
${defaults}
});

/**
 * Catalog selection rule per creation type.
 *
 * \`capability\` and \`outputModalities\` scope the picker to models that produce
 * this creation type; \`vendorCodes\` keeps only catalog vendors the generations
 * provider adapter dispatches. \`null\` means static-only.
 */
export const CREATIVE_MODEL_SELECTION_PROFILES: Readonly<
  Record<CreativeModelModality, CreativeModelSelectionProfile | null>
> = Object.freeze({
${renderProfiles()}
});

/** Creative modalities the remote sync covers, in deterministic order. */
export const REMOTE_SYNC_MODALITIES: readonly CreativeModelModality[] = [
${MODALITY_ORDER.filter((modality) => PROFILES[modality] !== undefined).map((modality) => `  ${js(modality)},`).join('\n')}
];

/**
 * Per-vendor parameter defaults.
 *
 * The remote sync can list a catalog model this file does not carry yet (a
 * model published after the last regeneration). Its wire row carries no
 * parameter profile, so the picker falls back to the vendor surface policy
 * below instead of offering every knob at once.
 */
export const VENDOR_IMAGE_PARAMETERS: Readonly<Record<string, CreativeModelImageParameters>> = ${jsValue(IMAGE_POLICIES, '')};

export const VENDOR_MUSIC_PARAMETERS: Readonly<Record<string, CreativeModelMusicParameters>> = ${jsValue(MUSIC_POLICIES, '')};

export const VENDOR_VOICE_PARAMETERS: Readonly<Record<string, CreativeModelVoiceParameters>> = ${jsValue(VOICE_POLICIES, '')};

export const VENDOR_SFX_PARAMETERS: Readonly<Record<string, CreativeModelSfxParameters>> = ${jsValue(SFX_POLICIES, '')};

/** Conservative generation modes for an unprofiled model of each video vendor. */
export const VENDOR_VIDEO_GENERATION_MODES: Readonly<Record<string, readonly string[]>> = ${jsValue(VENDOR_VIDEO_FALLBACK_MODES, '')};

/**
 * Full composer generation modes the adapter dispatches per video vendor.
 * Runtime catalog profiles are intersected with this set, the same way these
 * static profiles were generated.
 */
export const VENDOR_VIDEO_ADAPTER_MODES: Readonly<Record<string, readonly string[]>> = ${jsValue(ADAPTER_VIDEO_MODES, '')};
`
}

if (!existsSync(modelsRoot)) {
  console.error(`sdkwork-models catalog not found at ${modelsRoot}`)
  console.error('Set SDKWORK_MODELS_ROOT to the sibling checkout\'s models directory.')
  process.exit(1)
}

const catalog = readJson(join(modelsRoot, 'index.json'))
const rows = catalogModels()
const videoProfiles = catalogVideoProfiles()
const lists = {}
for (const modality of MODALITY_ORDER) {
  if (PROFILES[modality] === undefined) {
    lists[modality] = CURATED[modality]
    continue
  }
  lists[modality] = modality === 'music'
    ? catalogOnlyMusicModels(rows)
    : modality === 'voice' ? voiceModels(rows) : modelsFor(modality, rows)
  // A video-capable catalog model can still be avatar- or motion-only; those
  // belong to the digital-human / action creation types.
  if (modality === 'video') {
    lists[modality] = lists[modality].filter((model) => (
      videoParameters(model.vendorCode, videoProfiles.get(`${model.vendorCode}/${model.modelId}`)) !== undefined
    ))
  }
  if (lists[modality].length === 0) {
    console.error(`no catalog model matches the ${modality} creation type`)
    process.exit(1)
  }
}

writeFileSync(target, render(catalog, lists, videoProfiles))
console.log(`creative model catalog from sdkwork-models ${catalog.catalogVersion}:`)
for (const modality of MODALITY_ORDER) {
  console.log(`  ${modality}: ${lists[modality].length} models`)
}
console.log(`  -> ${target}`)
