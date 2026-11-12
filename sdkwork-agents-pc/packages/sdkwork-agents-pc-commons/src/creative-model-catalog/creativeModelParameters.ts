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
  CreativeModelVideoParameters,
} from './creativeModelCatalogTypes'
import {
  VENDOR_IMAGE_PARAMETERS,
  VENDOR_MUSIC_PARAMETERS,
  VENDOR_SFX_PARAMETERS,
  VENDOR_VIDEO_GENERATION_MODES,
  VENDOR_VOICE_PARAMETERS,
} from './staticCreativeModelCatalog'

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
