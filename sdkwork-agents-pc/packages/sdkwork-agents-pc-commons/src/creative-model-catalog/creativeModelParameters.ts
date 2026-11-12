/**
 * Pure parameter-support helpers over the creative model catalog.
 *
 * The picker renders only the knobs a model accepts and submits only the values
 * that model's vendor surface understands. These helpers hold that logic so the
 * input-box hook, the command builder and the specs share one implementation.
 */
import type {
  CreativeModelDuration,
  CreativeModelImageParameters,
  CreativeModelModality,
  CreativeModelParameters,
  CreativeModelReferencePrice,
  CreativeModelVideoParameters,
} from './creativeModelCatalogTypes'
import {
  VENDOR_IMAGE_PARAMETERS,
  VENDOR_MUSIC_PARAMETERS,
  VENDOR_SFX_PARAMETERS,
  VENDOR_VIDEO_ADAPTER_MODES,
  VENDOR_VIDEO_GENERATION_MODES,
  VENDOR_VOICE_PARAMETERS,
} from './staticCreativeModelCatalog'

/** One catalog video generation profile as the app API returns it. */
export interface CatalogVideoProfile {
  generationMode: string
  aspectRatios?: readonly string[] | null
  resolution?: string | null
  outputAudio?: boolean | null
  minDurationSeconds?: number | null
  maxDurationSeconds?: number | null
  durationStepSeconds?: number | null
  durationSeconds?: number | null
  isDefault?: boolean | null
}

/** Canonical display order for video generation modes. */
const VIDEO_MODE_ORDER = [
  'text_to_video',
  'image_to_video',
  'reference_to_video',
  'start_end_frame',
]

/** Canonical aspect-ratio order (wide to tall). */
const ASPECT_RATIO_ORDER = ['21:9', '16:9', '3:2', '4:3', '1:1', '3:4', '2:3', '9:16']

/** Resolution tier order used to sort the picker rows. */
const RESOLUTION_RANK: Record<string, number> = {
  '480p': 1,
  '540p': 2,
  '720p': 3,
  '768p': 4,
  '1080p': 5,
  '2k': 6,
  '4k': 7,
}

function orderedUnique(values: readonly string[], order: readonly string[]): string[] {
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

/**
 * Aggregate runtime catalog video profiles into the picker's parameter model.
 *
 * The app API publishes the authoritative per-model profiles
 * (`GET /app/v3/api/ai/video_profiles`), so the picker can constrain a model
 * the static baseline has never seen. Modes are intersected with the ones the
 * generations adapter dispatches for the vendor; ratios/resolutions are the
 * union across profiles; the duration control merges ranges and discrete
 * values.
 *
 * @param vendorCode - catalog vendor code of the model.
 * @param profiles - the model's catalog profiles.
 * @returns the parameter profile, or `undefined` when no mode is dispatchable.
 */
export function videoParametersFromProfiles(
  vendorCode: string | null | undefined,
  profiles: readonly CatalogVideoProfile[],
): CreativeModelVideoParameters | undefined {
  if (profiles.length === 0) return undefined
  const adapterModes = VENDOR_VIDEO_ADAPTER_MODES[(vendorCode ?? '').trim().toLowerCase()] ?? []
  const generationModes = orderedUnique(
    profiles.map((profile) => profile.generationMode).filter((mode) => adapterModes.includes(mode)),
    VIDEO_MODE_ORDER,
  )
  if (generationModes.length === 0) return undefined

  const aspectRatios = orderedUnique(
    profiles.flatMap((profile) => profile.aspectRatios ?? []),
    ASPECT_RATIO_ORDER,
  )
  const resolutions = [...new Set(
    profiles
      .map((profile) => profile.resolution)
      .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
      .map((value) => value.toLowerCase()),
  )].sort((left, right) => (RESOLUTION_RANK[left] ?? 99) - (RESOLUTION_RANK[right] ?? 99))

  const ranges = profiles.filter((profile) => (
    Number.isFinite(profile.minDurationSeconds) && Number.isFinite(profile.maxDurationSeconds)
  ))
  const fixed = profiles
    .map((profile) => profile.durationSeconds)
    .filter((value): value is number => Number.isFinite(value))
  let duration: CreativeModelDuration | null = null
  if (ranges.length > 0) {
    const minSeconds = Math.min(...ranges.map((profile) => profile.minDurationSeconds as number))
    const maxSeconds = Math.max(...ranges.map((profile) => profile.maxDurationSeconds as number))
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
  }

  return {
    generationModes,
    aspectRatios,
    resolutions,
    duration,
    outputAudio: profiles.some((profile) => profile.outputAudio === true),
  }
}

/** Catalog vendor code → the display name shown on model cards. */
const VENDOR_DISPLAY_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  google: 'Google',
  kuaishou: 'Kuaishou',
  kling: 'Kling',
  vidu: 'Vidu',
  bytedance: 'ByteDance',
  suno: 'Suno',
  minimax: 'MiniMax',
  elevenlabs: 'ElevenLabs',
}

/**
 * Human vendor name for a catalog vendor code.
 * @param vendorCode - catalog vendor code (`bytedance`, `kuaishou`, ...).
 * @returns the display name, or the code itself when unknown.
 */
export function vendorDisplayName(vendorCode: string | null | undefined): string {
  const code = (vendorCode ?? '').trim().toLowerCase()
  if (code === '') return ''
  return VENDOR_DISPLAY_NAMES[code] ?? code
}

/** Compact capability chips a video model row can show. */
export function videoCapabilityChips(
  parameters: CreativeModelVideoParameters | undefined,
): string[] {
  if (!parameters) return []
  const chips: string[] = []
  if (parameters.outputAudio) chips.push('含音频')
  if (parameters.generationModes.includes('start_end_frame')) chips.push('首尾帧')
  if (parameters.generationModes.includes('reference_to_video')) chips.push('多参考')
  if (parameters.duration?.values.length) chips.push('固定时长')
  return chips
}

/** Resolution tiers joined as a compact range (`480p–4K`). */
function resolutionRange(resolutions: readonly string[]): string {
  if (resolutions.length === 0) return ''
  const upper = (value: string): string => value.toUpperCase()
  if (resolutions.length === 1) return upper(resolutions[0])
  return `${upper(resolutions[0])}–${upper(resolutions[resolutions.length - 1])}`
}

/** Duration values joined as a compact range (`2–12s`, `5s / 10s`). */
function durationRangeLabel(duration: CreativeModelDuration | null | undefined): string {
  if (!duration) return ''
  if (duration.values.length > 0) return `${duration.values.join('s / ')}s`
  if (duration.minSeconds === duration.maxSeconds) return `${duration.minSeconds}s`
  return `${duration.minSeconds}–${duration.maxSeconds}s`
}

/**
 * One-line numeric capability summary for a model row.
 *
 * Video: `480p–4K · 2–12s`; image: `1K–4K · 4 张`; music/sfx: the duration
 * range; voice: the number of vendor voices.
 *
 * @param parameters - the model's parameter profile.
 * @param modality - creation type the row belongs to.
 * @returns the summary, or `undefined` when the model declares no parameters.
 */
export function modelParameterSummary(
  parameters: CreativeModelParameters | undefined,
  modality: CreativeModelModality,
): string | undefined {
  if (!parameters) return undefined
  if (modality === 'video') {
    const video = parameters.video
    if (!video) return undefined
    const parts = [resolutionRange(video.resolutions), durationRangeLabel(video.duration)].filter(Boolean)
    return parts.length > 0 ? parts.join(' · ') : undefined
  }
  if (modality === 'image') {
    const image = parameters.image
    if (!image) return undefined
    const parts = [resolutionRange(image.resolutions)]
    if (image.maxCount > 1) parts.push(`${image.maxCount} 张`)
    return parts.filter(Boolean).join(' · ') || undefined
  }
  if (modality === 'music' || modality === 'sound_effects') {
    const duration = modality === 'music' ? parameters.music?.duration : parameters.sound_effects?.duration
    const label = durationRangeLabel(duration)
    return label === '' ? undefined : label
  }
  if (modality === 'voice') {
    const count = parameters.voice?.voices.length ?? 0
    return count > 0 ? `${count} 个音色` : undefined
  }
  return undefined
}

/** Meter code → the unit label shown next to a reference price. */
const METER_UNIT_LABELS: Record<string, string> = {
  video_output_second: '/秒',
  music_output_second: '/秒',
  audio_output_second: '/秒',
  audio_output_minute: '/分钟',
  video_result: '/条',
  image_result: '/张',
  sfx_result: '/次',
  api_result: '/次',
  tts_input_character: '/字符',
  speech_character: '/字符',
  image_megapixel: '/百万像素',
}

/** Preferred currency symbol. */
function currencySymbol(currency: string): string {
  if (currency === 'CNY') return '¥'
  if (currency === 'USD') return '$'
  return `${currency} `
}

function priceMeterRank(meterCode: string): number {
  if (meterCode.startsWith('video_') || meterCode.startsWith('music_')) return 0
  if (meterCode.startsWith('image_')) return 1
  if (meterCode.startsWith('audio_') || meterCode.startsWith('sfx_') || meterCode.startsWith('tts_')) return 2
  if (meterCode === 'api_result') return 9
  return 5
}

/**
 * The reference price row a model card should show.
 *
 * Prefers the China region, then the media meter over the generic per-request
 * meter, then the lowest unit price.
 *
 * @param prices - public reference prices of the model.
 * @returns the chosen row, or `undefined` when none is displayable.
 */
export function preferredReferencePrice(
  prices: readonly CreativeModelReferencePrice[] | undefined,
): CreativeModelReferencePrice | undefined {
  if (!prices || prices.length === 0) return undefined
  const displayable = prices.filter((price) => {
    const value = Number(price.unitPrice)
    return Number.isFinite(value) && value > 0
  })
  if (displayable.length === 0) return undefined
  return [...displayable].sort((left, right) => (
    Number(right.regionCode === 'cn') - Number(left.regionCode === 'cn')
    || priceMeterRank(left.meterCode) - priceMeterRank(right.meterCode)
    || Number(left.unitPrice) - Number(right.unitPrice)
  ))[0]
}

/**
 * Compact price label for a model row (`¥0.5/秒`).
 * @param prices - public reference prices of the model.
 * @returns the label, or `undefined` when no price is published.
 */
export function referencePriceLabel(
  prices: readonly CreativeModelReferencePrice[] | undefined,
): string | undefined {
  const price = preferredReferencePrice(prices)
  if (!price) return undefined
  const unit = METER_UNIT_LABELS[price.meterCode] ?? '/次'
  return `${currencySymbol(price.currency)}${price.unitPrice}${unit}`
}

/**
 * Vendor-level parameter defaults for a catalog model the static baseline does
 * not carry yet.
 *
 * The remote sync lists newly published catalog models before this app is
 * regenerated, and the app API carries no parameter profile. The vendor surface
 * still bounds the knobs, so the picker uses that policy: image/music/voice/
 * sound-effect policies are complete, and video gets only the two modes every
 * wired video vendor supports (ratios/resolutions/duration stay unconstrained
 * instead of guessing a model's capabilities).
 *
 * @param modality - creation type being listed.
 * @param vendorCode - catalog vendor code from the remote row.
 * @returns the fallback parameters, or `undefined` for an unknown vendor.
 */
export function vendorDefaultParameters(
  modality: CreativeModelModality,
  vendorCode: string | null | undefined,
): CreativeModelParameters | undefined {
  const vendor = (vendorCode ?? '').trim().toLowerCase()
  if (vendor === '') return undefined
  if (modality === 'image') {
    const image = VENDOR_IMAGE_PARAMETERS[vendor]
    return image === undefined ? undefined : { image }
  }
  if (modality === 'video') {
    const generationModes = VENDOR_VIDEO_GENERATION_MODES[vendor]
    if (generationModes === undefined) return undefined
    return {
      video: {
        generationModes: [...generationModes],
        aspectRatios: [],
        resolutions: [],
        duration: null,
        outputAudio: false,
      },
    }
  }
  if (modality === 'music') {
    const music = VENDOR_MUSIC_PARAMETERS[vendor]
    return music === undefined ? undefined : { music }
  }
  if (modality === 'voice') {
    const voice = VENDOR_VOICE_PARAMETERS[vendor]
    return voice === undefined ? undefined : { voice }
  }
  if (modality === 'sound_effects') {
    const soundEffects = VENDOR_SFX_PARAMETERS[vendor]
    return soundEffects === undefined ? undefined : { sound_effects: soundEffects }
  }
  return undefined
}

/** The three video reference modes the composer exposes. */
export type CreativeVideoSettingsMode = 'all_around' | 'first_last' | 'smart_multi'

/**
 * Composer mode → catalog generation modes that can serve it.
 *
 * `all_around` is the general reference mode: any of the three generation
 * paths can represent it. The other two are precise and only list when the
 * model's catalog profile declares the matching generation mode.
 */
export const VIDEO_SETTINGS_MODE_GENERATION_MODES: Readonly<
  Record<CreativeVideoSettingsMode, readonly string[]>
> = Object.freeze({
  all_around: ['text_to_video', 'image_to_video', 'reference_to_video'],
  first_last: ['start_end_frame'],
  smart_multi: ['multi_shot'],
})

/** Motion/avatar surfaces are separate creation types, never composer modes. */
const VIDEO_REFERENCE_MODES: readonly CreativeVideoSettingsMode[] = [
  'all_around',
  'first_last',
  'smart_multi',
]

/**
 * Composer modes a model can serve.
 * @param parameters - the selected model's video parameters, when known.
 * @returns the supported modes in display order; `undefined` when the model
 * declares no parameter profile (remote-only entries) and every mode is open.
 */
export function supportedVideoSettingsModes(
  parameters: CreativeModelVideoParameters | undefined,
): CreativeVideoSettingsMode[] | undefined {
  if (parameters === undefined) return undefined
  const modes = VIDEO_REFERENCE_MODES.filter((mode) => (
    VIDEO_SETTINGS_MODE_GENERATION_MODES[mode]
      .some((generationMode) => parameters.generationModes.includes(generationMode))
  ))
  return modes.length > 0 ? modes : ['all_around']
}

/**
 * Clamp one duration to the values a model accepts.
 *
 * Discrete policies snap to the nearest listed value; range policies clamp and
 * round to the step. Without a profile the caller keeps its own value.
 *
 * @param seconds - requested duration.
 * @param duration - the model's accepted duration control.
 * @returns a duration the model accepts.
 */
export function clampDurationSeconds(
  seconds: number,
  duration: CreativeModelDuration | null | undefined,
): number {
  if (!duration) return seconds
  if (duration.values.length > 0) {
    return duration.values.reduce((closest, value) => (
      Math.abs(value - seconds) < Math.abs(closest - seconds) ? value : closest
    ), duration.values[0])
  }
  const step = duration.stepSeconds > 0 ? duration.stepSeconds : 1
  const clamped = Math.min(duration.maxSeconds, Math.max(duration.minSeconds, seconds))
  const snapped = Math.round((clamped - duration.minSeconds) / step) * step + duration.minSeconds
  // Floating steps (sound effects use 0.5s) must not accumulate noise.
  return Math.min(duration.maxSeconds, Math.max(duration.minSeconds, Number(snapped.toFixed(2))))
}

/**
 * Resolution values a model can advertise, in the picker's uppercase form.
 * @param parameters - the selected model's video parameters, when known.
 * @returns uppercase resolutions, or `undefined` when the model is unprofiled.
 */
export function supportedVideoResolutions(
  parameters: CreativeModelVideoParameters | undefined,
): string[] | undefined {
  if (parameters === undefined) return undefined
  return parameters.resolutions.map((resolution) => resolution.toUpperCase())
}

/**
 * Aspect ratios a model accepts.
 * @param parameters - the selected model's video parameters, when known.
 * @returns ratios in catalog order, or `undefined` when the model is unprofiled.
 */
export function supportedVideoAspectRatios(
  parameters: CreativeModelVideoParameters | undefined,
): string[] | undefined {
  return parameters === undefined ? undefined : [...parameters.aspectRatios]
}

/**
 * Aspect ratios an image model accepts. `智能` (let the model choose) lists only
 * for surfaces that accept an explicit size, because the composer turns it into
 * a square canvas.
 * @param parameters - the selected model's image parameters, when known.
 * @returns ratios, or `undefined` when the model is unprofiled.
 */
export function supportedImageAspectRatios(
  parameters: CreativeModelImageParameters | undefined,
): string[] | undefined {
  if (parameters === undefined) return undefined
  return parameters.customSize
    ? ['智能', ...parameters.aspectRatios]
    : [...parameters.aspectRatios]
}

/**
 * Resolve the catalog generation mode a composer submit represents.
 *
 * The composer keeps one operation per request (the app API routes by
 * operation), so the precise mode travels as `parameters.generationMode` and
 * lets the vendor adapter pick the right surface (reference-to-video,
 * first/last-frame, ...).
 *
 * @param mode - selected composer mode.
 * @param hasReferenceImages - whether media references are attached.
 * @param parameters - the selected model's video parameters, when known.
 * @returns the generation mode to submit.
 */
export function resolveVideoGenerationMode(
  mode: CreativeVideoSettingsMode,
  hasReferenceImages: boolean,
  parameters: CreativeModelVideoParameters | undefined,
): string {
  const declared = parameters?.generationModes
  const supports = (generationMode: string): boolean => (
    declared === undefined || declared.includes(generationMode)
  )
  if (mode === 'first_last' && hasReferenceImages && supports('start_end_frame')) return 'start_end_frame'
  if (mode === 'smart_multi' && supports('multi_shot')) return 'multi_shot'
  if (hasReferenceImages) {
    if (supports('reference_to_video')) return 'reference_to_video'
    if (supports('image_to_video')) return 'image_to_video'
  }
  return 'text_to_video'
}

/**
 * Operation the generations app API takes for a generation mode.
 * @param generationMode - resolved generation mode.
 * @returns the app API operation type.
 */
export function generationOperationType(
  generationMode: string,
): 'text_to_video' | 'image_to_video' | 'video_extend' {
  if (generationMode === 'text_to_video') return 'text_to_video'
  if (generationMode === 'video_edit' || generationMode === 'video_extend') return 'video_extend'
  return 'image_to_video'
}

/**
 * The wire aspect ratio for a composer ratio selection.
 * `智能` lets the model choose, so no aspect ratio is sent; the explicit pixel
 * `size` still carries the square canvas.
 * @param ratio - composer ratio.
 * @returns the wire value, or `undefined` to omit it.
 */
export function wireAspectRatio(ratio: string | undefined): string | undefined {
  const normalized = (ratio ?? '').trim()
  if (normalized === '' || normalized === '智能') return undefined
  return normalized
}
