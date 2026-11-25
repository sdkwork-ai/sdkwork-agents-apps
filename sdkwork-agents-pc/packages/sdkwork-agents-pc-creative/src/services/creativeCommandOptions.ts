/**
 * Creative composer settings → generations command parameters.
 *
 * This is the seam between the input box (which knows what the user picked and
 * which upload means what) and the generations command plane (which carries
 * those choices to the vendor adapters). It lives in its own module so the
 * mapping is directly testable: a field dropped here never reaches the adapter,
 * and nothing downstream can recover it.
 *
 * Ownership:
 * - render knobs (ratio / resolution / duration / count / loop / audio / size)
 *   ride `parameters.generationConfig`;
 * - reference media rides `parameters.referenceImages` / `referenceVideos` and
 *   the role-tagged `parameters.referenceAssets`;
 * - the precise vendor surface rides `parameters.generationMode`.
 *
 * Ratio normalization stays with `wireAspectRatio` in `@sdkwork/agents-pc-commons`
 * so the composer, the credit estimate and the submit share one rule.
 */
import { wireAspectRatio } from '@sdkwork/agents-pc-commons';

/** Shape of the media resources the creative input box uploads through Drive. */
export interface CreativeMediaResourceLike {
  id?: string;
  uri?: string;
  url?: string;
  kind?: string;
  mimeType?: string;
  fileName?: string;
}

/** One role-tagged upload as the input box classifies it. */
export interface CreativeReferenceAssetLike {
  kind?: string;
  role?: string;
  name?: string;
  mimeType?: string;
  resource?: CreativeMediaResourceLike;
}

/** Command payload fragments a creative submit contributes. */
export interface CreativeCommandOptions {
  commandParameters?: Record<string, unknown>;
  commandInputAssetIds?: string[];
}

/** Drop blank entries so absent settings never widen the command payload. */
export function compactCreativeRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => (
      value !== undefined
      && value !== null
      && value !== ''
      && (!(Array.isArray(value)) || value.length > 0)
      && (!(typeof value === 'object' && !Array.isArray(value)) || Object.keys(value).length > 0)
    )),
  );
}

/**
 * One uploaded resource as a vendor-fetchable reference.
 *
 * Vendors fetch the presigned download URL; the Drive node id rides along for
 * server-side asset resolution.
 */
export function toCreativeReference(resource: CreativeMediaResourceLike): Record<string, string> {
  return compactCreativeRecord({
    url: resource.url || resource.uri,
    assetId: resource.id,
    mimeType: resource.mimeType,
    name: resource.fileName,
  }) as Record<string, string>;
}

/**
 * Build the command payload fragments for one creative submit.
 *
 * @param settings - the input box's live settings snapshot.
 * @returns the command parameters and Drive asset ids to attach, omitting any
 *   fragment the settings carry nothing for.
 */
export function buildCreativeCommandOptions(
  settings?: Record<string, unknown>,
): CreativeCommandOptions {
  const mediaResources = (Array.isArray(settings?.mediaResources)
    ? settings?.mediaResources
    : []) as CreativeMediaResourceLike[];
  // The input box classifies every upload (`first_frame` / `last_frame` /
  // `reference_audio` / `reference_video`); the generations adapter derives
  // `imageTail`, the avatar driving audio and the motion-mimicry reference from
  // those roles. Forwarding only the flat `mediaResources` list left the roles
  // behind, so a first/last-frame or voice-driven submit degraded to a plain
  // image prompt.
  const referenceAssets = (Array.isArray(settings?.referenceAssets)
    ? settings?.referenceAssets
    : []) as CreativeReferenceAssetLike[];
  if (mediaResources.length === 0 && referenceAssets.length === 0 && !settings) {
    return {};
  }
  const imageResources = mediaResources.filter((resource) => (
    (resource.kind ?? 'image') === 'image' && Boolean(resource.url || resource.uri)
  ));
  const videoResources = mediaResources.filter((resource) => (
    resource.kind === 'video' && Boolean(resource.url || resource.uri)
  ));
  const audioResource = mediaResources.find((resource) => (
    (resource.kind === 'audio' || resource.kind === 'voice') && Boolean(resource.url || resource.uri)
  ));
  const generationConfig = compactCreativeRecord({
    // `智能` lets the model choose; the explicit pixel `size` still applies.
    aspectRatio: wireAspectRatio(settings?.ratio as string | undefined),
    resolution: settings?.resolution,
    durationSeconds: settings?.duration,
    imageCount: settings?.count,
    loop: settings?.loop,
    audio: settings?.audio,
    size: settings?.imageWidth && settings?.imageHeight
      ? `${settings.imageWidth}x${settings.imageHeight}`
      : undefined,
  });
  const roleTaggedAssets = referenceAssets
    .map((asset): Record<string, string | undefined> => {
      const resource = asset.resource;
      return {
        ...(resource ? toCreativeReference(resource) : {}),
        kind: asset.kind,
        role: asset.role,
        name: asset.name,
        mimeType: asset.mimeType,
      };
    })
    // A reference the vendor cannot fetch is not a reference; the adapter
    // rejects an assetId-only entry, so keep only locator-bearing ones.
    .filter((asset) => Boolean(asset.url || asset.assetId));
  const commandParameters = compactCreativeRecord({
    // Precise generation mode (`reference_to_video`, `start_end_frame`, ...);
    // the vendor adapter picks the matching surface from it.
    generationMode: settings?.generationMode,
    // Vendor voice id for speech synthesis.
    voice: settings?.voiceId,
    generationConfig,
    referenceImages: imageResources.map(toCreativeReference),
    referenceVideos: videoResources.map(toCreativeReference),
    // Role-tagged uploads ride their own list so the adapter can read the
    // intent (first/last frame, driving audio, motion reference) instead of
    // guessing it from media type.
    referenceAssets: roleTaggedAssets,
    audioUrl: audioResource?.url || audioResource?.uri,
  });
  const commandInputAssetIds = imageResources
    .map((resource) => resource.id)
    .filter((id): id is string => Boolean(id?.trim()));
  return {
    ...(Object.keys(commandParameters).length > 0 ? { commandParameters } : {}),
    ...(commandInputAssetIds.length > 0 ? { commandInputAssetIds } : {}),
  };
}
