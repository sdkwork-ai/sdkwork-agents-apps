/**
 * One dispatch decision shared by the command submitter and the credit
 * estimator.
 *
 * The app API routes a generation by operation, so the precise catalog
 * generation mode (`reference_to_video`, `start_end_frame`, ...) travels as a
 * parameter while the operation stays one of the routed ones. Both the submit
 * and the estimate must therefore make the same choice, or the estimate prices
 * a different command than the one charged.
 */
import {
  resolveCreativeGenerationDispatch,
  type CreativeGenerationDispatch,
} from '@sdkwork/agents-pc-core/sdk/creationTypes'

import { generationOperationType } from './creativeModelParameters'

/** Inputs that decide which routed operation a creative submit uses. */
export interface CreativeDispatchOptions {
  /** Reference media attached; upgrades image/video defaults. */
  hasReferenceImages?: boolean
  /** Precise catalog generation mode for video commands. */
  generationMode?: string
}

/**
 * Resolve the routed operation a creative submit uses.
 *
 * @param mode - creation type (`image`, `video`, ...; `agent` prices as image).
 * @param options - reference/mode inputs.
 * @returns the dispatch, or `null` for a non-generation mode.
 */
export function resolveCreativeDispatch(
  mode: string | null | undefined,
  options: CreativeDispatchOptions = {},
): CreativeGenerationDispatch | null {
  const base = resolveCreativeGenerationDispatch(mode, {
    hasReferenceImages: options.hasReferenceImages,
  }) ?? (mode === 'agent' ? resolveCreativeGenerationDispatch('image') : null)
  if (base === null || base.modality !== 'video' || options.generationMode === undefined) {
    return base
  }
  return {
    modality: 'video',
    operationType: generationOperationType(options.generationMode),
  }
}
