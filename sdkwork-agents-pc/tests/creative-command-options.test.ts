/**
 * Creative composer → generations command parameter contract.
 *
 * `buildCreativeCommandOptions` is the only place the input box's settings
 * become command parameters. A field dropped here never reaches the vendor
 * adapter, and nothing downstream can recover it — so every creation type's
 * knob and every reference-asset role is pinned here.
 *
 * Runs with `tsx --test` (no browser, no network).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCreativeCommandOptions,
  toCreativeReference,
} from '../packages/sdkwork-agents-pc-creative/src/services/creativeCommandOptions';
import { resolveCreativeDispatch } from '../packages/sdkwork-agents-pc-commons/src/creative-model-catalog/creativeDispatch';
import { CREATIVE_DEFAULT_OPERATION_BY_MODALITY } from '../packages/sdkwork-agents-pc-core/src/sdk/creationTypes';

/** One uploaded Drive resource as the input box reports it. */
function media(kind: string, url: string, extra: Record<string, unknown> = {}) {
  return {
    id: `asset-${kind}-1`,
    kind,
    mimeType: `${kind}/test`,
    fileName: `${kind}.test`,
    uri: `drive://space/${kind}`,
    url,
    ...extra,
  };
}

test('image settings reach generationConfig and the image reference list', () => {
  const options = buildCreativeCommandOptions({
    model: 'gpt-image-2',
    ratio: '16:9',
    count: 2,
    mediaResources: [media('image', 'https://cdn.example/source.png')],
  });

  assert.deepEqual(options.commandParameters?.generationConfig, {
    aspectRatio: '16:9',
    imageCount: 2,
  });
  assert.deepEqual(options.commandParameters?.referenceImages, [
    { assetId: 'asset-image-1', mimeType: 'image/test', name: 'image.test', url: 'https://cdn.example/source.png' },
  ]);
  assert.deepEqual(options.commandInputAssetIds, ['asset-image-1']);
});

test('`智能` ratio is omitted so the model chooses', () => {
  const options = buildCreativeCommandOptions({ ratio: '智能', count: 1 });
  assert.deepEqual(
    options.commandParameters?.generationConfig,
    { imageCount: 1 },
    'the ratio must be omitted; the count still rides the config',
  );
});

test('video settings carry resolution, duration and the synchronized-audio flag', () => {
  const options = buildCreativeCommandOptions({
    ratio: '9:16',
    resolution: '1080p',
    duration: 8,
    audio: true,
  });
  assert.deepEqual(options.commandParameters?.generationConfig, {
    aspectRatio: '9:16',
    audio: true,
    durationSeconds: 8,
    resolution: '1080p',
  });
});

test('the precise generation mode reaches parameters.generationMode', () => {
  for (const generationMode of ['start_end_frame', 'reference_to_video', 'image_to_video']) {
    const options = buildCreativeCommandOptions({ generationMode });
    assert.equal(options.commandParameters?.generationMode, generationMode);
  }
});

test('every reference role reaches parameters.referenceAssets with its locator', () => {
  const options = buildCreativeCommandOptions({
    referenceAssets: [
      { kind: 'image', role: 'first_frame', name: 'first.png', resource: media('image', 'https://cdn.example/first.png') },
      { kind: 'image', role: 'last_frame', name: 'last.png', resource: media('image', 'https://cdn.example/last.png') },
      { kind: 'audio', role: 'reference_audio', name: 'voice.mp3', resource: media('audio', 'https://cdn.example/voice.mp3') },
      { kind: 'video', role: 'reference_video', name: 'motion.mp4', resource: media('video', 'https://cdn.example/motion.mp4') },
    ],
  });

  const assets = options.commandParameters?.referenceAssets as Array<Record<string, string>>;
  assert.deepEqual(
    assets.map((asset) => asset.role),
    ['first_frame', 'last_frame', 'reference_audio', 'reference_video'],
    'every upload keeps its role; a dropped role silently changes the render',
  );
  assert.deepEqual(
    assets.map((asset) => asset.url),
    [
      'https://cdn.example/first.png',
      'https://cdn.example/last.png',
      'https://cdn.example/voice.mp3',
      'https://cdn.example/motion.mp4',
    ],
    'every upload keeps a vendor-fetchable locator',
  );
  assert.deepEqual(assets.map((asset) => asset.kind), ['image', 'image', 'audio', 'video']);
});

test('a reference with no locator is dropped instead of sent unfetchable', () => {
  const options = buildCreativeCommandOptions({
    referenceAssets: [
      { kind: 'image', role: 'first_frame', name: 'no-url.png', resource: { id: '' } },
      { kind: 'image', role: 'reference_image', name: 'ok.png', resource: media('image', 'https://cdn.example/ok.png') },
    ],
  });
  const assets = options.commandParameters?.referenceAssets as Array<Record<string, string>>;
  assert.equal(assets.length, 1, 'only the locator-bearing reference survives');
  assert.equal(assets[0].role, 'reference_image');
});

test('speech settings carry the vendor voice id', () => {
  const options = buildCreativeCommandOptions({ voiceId: '21m00Tcm4TlvDq8ikWAM' });
  assert.equal(options.commandParameters?.voice, '21m00Tcm4TlvDq8ikWAM');
});

test('sound-effect settings carry the loop flag inside generationConfig', () => {
  // The adapter reads `loop` from `generationConfig`, never from the top level.
  const options = buildCreativeCommandOptions({ loop: true, duration: 4 });
  assert.deepEqual(options.commandParameters?.generationConfig, {
    durationSeconds: 4,
    loop: true,
  });
});

test('an audio upload reaches the avatar driving-audio field', () => {
  const options = buildCreativeCommandOptions({
    mediaResources: [media('audio', 'https://cdn.example/driving.mp3', { kind: 'audio' })],
  });
  assert.equal(options.commandParameters?.audioUrl, 'https://cdn.example/driving.mp3');
});

test('an explicit pixel size reaches generationConfig as WxH', () => {
  const options = buildCreativeCommandOptions({ imageWidth: 1024, imageHeight: 768 });
  assert.equal(
    (options.commandParameters?.generationConfig as Record<string, unknown>).size,
    '1024x768',
  );
});

test('settings with nothing to send produce no command parameters', () => {
  assert.deepEqual(buildCreativeCommandOptions(undefined), {});
});

test('toCreativeReference keeps the Drive id alongside the fetchable URL', () => {
  assert.deepEqual(
    toCreativeReference(media('video', 'https://cdn.example/a.mp4')),
    {
      assetId: 'asset-video-1',
      mimeType: 'video/test',
      name: 'video.test',
      url: 'https://cdn.example/a.mp4',
    },
  );
});

/**
 * Every creation type the composer offers must resolve to a routed operation.
 *
 * This is the front half of the vendor × creation-type completeness matrix: the
 * operations below are the ones the generations service mounts
 * (`POST /app/v3/api/generations/videos/avatar` → `avatar_video`, etc.), and the
 * generations provider adapter dispatches on them.
 */
test('every creation type resolves to a routed generations operation', () => {
  const expected: Record<string, { modality: string; operationType: string }> = {
    image: { modality: 'image', operationType: 'text_to_image' },
    video: { modality: 'video', operationType: 'text_to_video' },
    music: { modality: 'music', operationType: 'text_to_music' },
    voice: { modality: 'voice', operationType: 'speech' },
    // The dispatch mode id is `sfx`; the wire modality/operation is
    // `sound_effects`.
    sfx: { modality: 'sound_effects', operationType: 'sound_effects' },
    // The motion creation types are their own grouping id: the command plane
    // selects the SDK method by `operationType`, so `avatar` /
    // `motion_mimicry` are what reach the wire.
    digital_human: { modality: 'digital_human', operationType: 'avatar' },
    action: { modality: 'action', operationType: 'motion_mimicry' },
  };
  for (const [creationType, expectedDispatch] of Object.entries(expected)) {
    const dispatch = resolveCreativeDispatch(creationType);
    assert.ok(dispatch, `${creationType} must resolve to a generation dispatch`);
    assert.equal(dispatch.modality, expectedDispatch.modality, `${creationType}: modality`);
    assert.equal(dispatch.operationType, expectedDispatch.operationType, `${creationType}: operation`);
  }
});

test('a bare modality never falls back to text_to_image', () => {
  // The default-operation table is the only place the modality → operation
  // pairing is written down; a missing entry used to collapse every unknown
  // creation type onto a text-to-image request.
  for (const [modality, operationType] of Object.entries(CREATIVE_DEFAULT_OPERATION_BY_MODALITY)) {
    assert.ok(operationType, `${modality} must declare a default operation`);
    if (modality !== 'image') {
      assert.notEqual(
        operationType,
        'text_to_image',
        `${modality} must not degrade to a text-to-image command`,
      );
    }
  }
});
