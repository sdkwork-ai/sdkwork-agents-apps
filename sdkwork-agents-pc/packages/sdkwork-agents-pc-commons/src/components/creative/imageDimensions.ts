/**
 * Image canvas mapping shared by the creative input box and its settings
 * dropdown.
 *
 * The picker resolves an aspect ratio plus a resolution tier into explicit
 * pixels; those pixels become the command's `size` for vendor surfaces that
 * accept an explicit `WIDTHxHEIGHT`. Keeping the map in one module means the
 * control that renders the ratio grid and the model clamp that rewrites a
 * selection always agree on the pixel result.
 */

export type CreativeImageRatio = '智能' | '21:9' | '16:9' | '3:2' | '4:3' | '1:1' | '3:4' | '2:3' | '9:16'

/** Aspect-ratio choices the image picker can render, largest to tallest. */
export const IMAGE_RATIO_OPTIONS: readonly CreativeImageRatio[] = [
  '智能',
  '21:9',
  '16:9',
  '3:2',
  '4:3',
  '1:1',
  '3:4',
  '2:3',
  '9:16',
]

/** Resolution tiers the image picker can render. */
export const IMAGE_RESOLUTION_OPTIONS = ['1K', '2K', '4K'] as const

export type CreativeImageResolution = (typeof IMAGE_RESOLUTION_OPTIONS)[number]

/** Explicit pixels for every ratio/resolution pair. */
export const IMAGE_DIMENSIONS_MAP: Readonly<
  Record<CreativeImageResolution, Readonly<Record<CreativeImageRatio, { w: number; h: number }>>>
> = {
  '1K': {
    智能: { w: 1024, h: 1024 },
    '21:9': { w: 1536, h: 648 },
    '16:9': { w: 1344, h: 756 },
    '3:2': { w: 1200, h: 800 },
    '4:3': { w: 1152, h: 864 },
    '1:1': { w: 1024, h: 1024 },
    '3:4': { w: 864, h: 1152 },
    '2:3': { w: 800, h: 1200 },
    '9:16': { w: 756, h: 1344 },
  },
  '2K': {
    智能: { w: 1328, h: 1328 },
    '21:9': { w: 1920, h: 816 },
    '16:9': { w: 1728, h: 972 },
    '3:2': { w: 1600, h: 1066 },
    '4:3': { w: 1536, h: 1152 },
    '1:1': { w: 1328, h: 1328 },
    '3:4': { w: 1152, h: 1536 },
    '2:3': { w: 1066, h: 1600 },
    '9:16': { w: 972, h: 1728 },
  },
  '4K': {
    智能: { w: 2048, h: 2048 },
    '21:9': { w: 3072, h: 1296 },
    '16:9': { w: 2688, h: 1512 },
    '3:2': { w: 2400, h: 1600 },
    '4:3': { w: 2304, h: 1728 },
    '1:1': { w: 2048, h: 2048 },
    '3:4': { w: 1728, h: 2304 },
    '2:3': { w: 1600, h: 2400 },
    '9:16': { w: 1512, h: 2688 },
  },
}

/**
 * Resolve the explicit pixels for one ratio/resolution pair.
 * @param ratio - selected aspect ratio (`智能` maps to a square canvas).
 * @param resolution - selected resolution tier.
 * @returns width and height in pixels.
 */
export function imageDimensionsFor(
  ratio: string,
  resolution: string,
): { w: number; h: number } {
  const tier = (IMAGE_DIMENSIONS_MAP as Record<string, Record<string, { w: number; h: number }>>)[resolution]
    ?? IMAGE_DIMENSIONS_MAP['2K']
  return tier[ratio] ?? tier['1:1']
}
