import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  CREATIVE_MODEL_SELECTION_PROFILES,
  REMOTE_SYNC_MODALITIES,
  STATIC_CREATIVE_MODELS,
  STATIC_DEFAULT_MODEL_IDS,
} from '../packages/sdkwork-agents-pc-commons/src/creative-model-catalog/staticCreativeModelCatalog'
import {
  isCreationModel,
} from '../packages/sdkwork-agents-pc-commons/src/creative-model-catalog/creativeModelCatalogService'
import {
  resolveCreativeDispatch,
} from '../packages/sdkwork-agents-pc-commons/src/creative-model-catalog/creativeDispatch'
import {
  clampDurationSeconds,
  generationOperationType,
  groupModelsByVendor,
  modelMatchesSearch,
  modelParameterSummary,
  preferredReferencePrice,
  referencePriceLabel,
  referencePriceTooltip,
  resolveVideoGenerationMode,
  sortModelsByRecency,
  supportedImageAspectRatios,
  supportedVideoResolutions,
  supportedVideoSettingsModes,
  vendorDefaultParameters,
  vendorDisplayName,
  videoCapabilityChips,
  videoParametersFromProfiles,
  wireAspectRatio,
} from '../packages/sdkwork-agents-pc-commons/src/creative-model-catalog/creativeModelParameters'
import type {
  CreativeModelDefinition,
  CreativeModelDuration,
  CreativeModelModality,
  RemoteCreativeModelItem,
} from '../packages/sdkwork-agents-pc-commons/src/creative-model-catalog/creativeModelCatalogTypes'
import { toAgentLlmModels } from '../packages/sdkwork-agents-pc-commons/src/creative-model-catalog/agentLlmModels'

/**
 * Regression coverage for the creative model picker lists.
 *
 * The catalog's own `modalities` field unions input and output modalities, so
 * a video generation query also returned chat models that merely read video
 * input (Qwen3.7 Flash), and the picker listed them under 视频生成. These specs
 * pin the per-creation-type rule so that regression cannot come back silently.
 */

function remoteModel(overrides: Partial<RemoteCreativeModelItem> & Pick<RemoteCreativeModelItem, 'model' | 'vendorCode'>): RemoteCreativeModelItem {
  return {
    displayName: overrides.model,
    description: 'test model',
    modalities: [],
    outputModalities: [],
    capabilities: [],
    releaseStage: 1,
    shelfState: 1,
    routingState: 1,
    replacementModel: null,
    ...overrides,
  }
}

describe('creative model selection', () => {
  const qwenFlash = remoteModel({
    model: 'qwen3.7-flash',
    vendorCode: 'alibaba',
    // The catalog records video as an *input* modality and text as output.
    modalities: ['text', 'image', 'video'],
    outputModalities: ['text'],
    capabilities: ['chat'],
  })

  it('drops a chat model that only accepts video input from the video list', () => {
    assert.equal(isCreationModel('video', qwenFlash), false)
    assert.equal(isCreationModel('image', qwenFlash), false)
  })

  it('keeps a model that produces the creation type from a supported vendor', () => {
    const seedance = remoteModel({
      model: 'doubao-seedance-2-0-mini-260615',
      vendorCode: 'bytedance',
      modalities: ['text', 'image', 'video'],
      outputModalities: ['video'],
      capabilities: ['video'],
    })
    assert.equal(isCreationModel('video', seedance), true)
    assert.equal(isCreationModel('image', seedance), false)
  })

  it('drops a model whose vendor the generations adapter cannot dispatch', () => {
    const runway = remoteModel({
      model: 'gen4_turbo',
      vendorCode: 'runway',
      modalities: ['text', 'video'],
      outputModalities: ['video'],
      capabilities: ['video'],
    })
    assert.equal(isCreationModel('video', runway), false)
  })

  it('falls back to the union when the response carries no output modalities', () => {
    const legacy = remoteModel({
      model: 'kling-image-3.0',
      vendorCode: 'kuaishou',
      modalities: ['text', 'image'],
      outputModalities: undefined,
      capabilities: ['image'],
    })
    assert.equal(isCreationModel('image', legacy), true)
  })

  it('never lists models for static-only creation types', () => {
    const klingAvatar = remoteModel({
      model: 'master_mode',
      vendorCode: 'kling',
      modalities: ['image', 'audio'],
      outputModalities: ['video'],
      capabilities: ['video'],
    })
    assert.equal(isCreationModel('digital_human', klingAvatar), false)
    assert.equal(isCreationModel('action', klingAvatar), false)
  })

  it('keeps realtime voice agents out of the speech list', () => {
    const realtime = remoteModel({
      model: 'eleven_realtime_v1_max',
      vendorCode: 'elevenlabs',
      modalities: ['audio'],
      outputModalities: ['audio'],
      capabilities: ['audio'],
    })
    const speech = remoteModel({
      model: 'eleven_multilingual_v2',
      vendorCode: 'elevenlabs',
      modalities: ['text'],
      outputModalities: ['audio'],
      capabilities: ['audio'],
    })
    assert.equal(isCreationModel('voice', realtime), false)
    assert.equal(isCreationModel('voice', speech), true)
  })

  it('scopes sound effects to sound-effect capability models', () => {
    const soundEffect = remoteModel({
      model: 'eleven_text_to_sound_v2',
      vendorCode: 'elevenlabs',
      modalities: ['text'],
      outputModalities: ['audio'],
      capabilities: ['sfx'],
    })
    const speech = remoteModel({
      model: 'eleven_multilingual_v2',
      vendorCode: 'elevenlabs',
      modalities: ['text'],
      outputModalities: ['audio'],
      capabilities: ['audio'],
    })
    assert.equal(isCreationModel('sound_effects', soundEffect), true)
    assert.equal(isCreationModel('sound_effects', speech), false)
    assert.equal(isCreationModel('voice', speech), true)
  })
})

describe('static creative catalog', () => {
  const modalities = Object.keys(STATIC_CREATIVE_MODELS) as CreativeModelModality[]

  for (const modality of modalities) {
    it(`${modality} lists only dispatchable catalog models`, () => {
      const models = STATIC_CREATIVE_MODELS[modality]
      assert.ok(models.length > 0, `${modality} needs at least one model`)
      const ids = new Set<string>()
      for (const model of models) {
        assert.ok(model.id.trim().length > 0, `${modality} model id`)
        assert.ok(!ids.has(model.id), `${modality} repeats model ${model.id}`)
        ids.add(model.id)
        assert.equal(model.modality, modality)
        assert.ok(model.label.trim().length > 0)
        assert.ok(model.desc.trim().length > 0)
        const profile = CREATIVE_MODEL_SELECTION_PROFILES[modality]
        if (profile !== null) {
          assert.ok(
            profile.vendorCodes.includes((model.vendorCode ?? '').toLowerCase()),
            `${modality} model ${model.id} has vendor ${model.vendorCode} the generations adapter cannot dispatch`,
          )
        } else {
          // Static-only surfaces still need a vendor: the command plane routes
          // avatar / motion-mimicry by `parameters.vendor`.
          assert.ok((model.vendorCode ?? '').trim().length > 0, `${modality} model ${model.id} needs a vendor`)
        }
      }
    })

    it(`${modality} default model is listed`, () => {
      assert.ok(
        STATIC_CREATIVE_MODELS[modality].some((model) => model.id === STATIC_DEFAULT_MODEL_IDS[modality]),
        `${modality} default ${STATIC_DEFAULT_MODEL_IDS[modality]} is not in the list`,
      )
    })
  }

  it('syncs only the creation types with a catalog selection profile', () => {
    assert.deepEqual([...REMOTE_SYNC_MODALITIES], [
      'image',
      'video',
      'music',
      'voice',
      'sound_effects',
    ])
  })

  it('declares the vendor image count limits', () => {
    const maxCounts = new Map(
      STATIC_CREATIVE_MODELS.image.map((model) => [model.vendorCode, model.parameters?.image?.maxCount]),
    )
    assert.equal(maxCounts.get('openai'), 4)
    assert.equal(maxCounts.get('google'), 4)
    assert.equal(maxCounts.get('bytedance'), 4)
    assert.equal(maxCounts.get('kuaishou'), 1)
    assert.equal(maxCounts.get('vidu'), 1)
  })

  it('every model declares the parameter facets its creation type needs', () => {
    for (const model of STATIC_CREATIVE_MODELS.image) {
      assert.ok(model.parameters?.image, `image model ${model.id} needs image parameters`)
      assert.ok((model.parameters?.image?.aspectRatios.length ?? 0) > 0)
      assert.ok((model.parameters?.image?.resolutions.length ?? 0) > 0)
    }
    for (const model of STATIC_CREATIVE_MODELS.video) {
      const video = model.parameters?.video
      assert.ok(video, `video model ${model.id} needs video parameters`)
      assert.ok((video?.generationModes.length ?? 0) > 0, `${model.id} needs a generation mode`)
      assert.ok((video?.aspectRatios.length ?? 0) > 0, `${model.id} needs aspect ratios`)
      assert.ok((video?.resolutions.length ?? 0) > 0, `${model.id} needs resolutions`)
    }
    for (const model of STATIC_CREATIVE_MODELS.music) {
      assert.ok(model.parameters?.music, `music model ${model.id} needs music parameters`)
    }
    for (const model of STATIC_CREATIVE_MODELS.voice) {
      assert.ok((model.parameters?.voice?.voices.length ?? 0) > 0, `voice model ${model.id} needs voices`)
    }
    for (const model of STATIC_CREATIVE_MODELS.sound_effects) {
      assert.ok(model.parameters?.sound_effects, `sfx model ${model.id} needs sound-effect parameters`)
    }
  })
})

describe('creative parameter support', () => {
  const range: CreativeModelDuration = {
    minSeconds: 2,
    maxSeconds: 12,
    stepSeconds: 1,
    values: [],
    defaultSeconds: 4,
  }
  const discrete: CreativeModelDuration = {
    minSeconds: 5,
    maxSeconds: 10,
    stepSeconds: 5,
    values: [5, 10],
    defaultSeconds: 5,
  }

  it('clamps range durations onto the accepted step', () => {
    assert.equal(clampDurationSeconds(1, range), 2)
    assert.equal(clampDurationSeconds(15, range), 12)
    assert.equal(clampDurationSeconds(7, range), 7)
    assert.equal(clampDurationSeconds(99, null), 99)
  })

  it('snaps discrete durations to the nearest accepted value', () => {
    assert.equal(clampDurationSeconds(6, discrete), 5)
    assert.equal(clampDurationSeconds(9, discrete), 10)
  })

  it('keeps floating steps stable for sound effects', () => {
    const sfx: CreativeModelDuration = {
      minSeconds: 0.5,
      maxSeconds: 22,
      stepSeconds: 0.5,
      values: [],
      defaultSeconds: 4,
    }
    assert.equal(clampDurationSeconds(4.2, sfx), 4)
    assert.equal(clampDurationSeconds(4.3, sfx), 4.5)
  })

  it('resolves the generation mode from the composer mode and references', () => {
    const vidu = {
      generationModes: ['text_to_video', 'image_to_video', 'reference_to_video'],
      aspectRatios: ['16:9'],
      resolutions: ['720p'],
      duration: range,
      outputAudio: true,
    }
    assert.equal(resolveVideoGenerationMode('all_around', false, vidu), 'text_to_video')
    assert.equal(resolveVideoGenerationMode('all_around', true, vidu), 'reference_to_video')
    // A model without the start-end surface falls back to its reference mode
    // instead of dropping the attached references.
    assert.equal(resolveVideoGenerationMode('first_last', true, vidu), 'reference_to_video')

    const startEnd = {
      ...vidu,
      generationModes: ['text_to_video', 'image_to_video', 'start_end_frame'],
    }
    assert.equal(resolveVideoGenerationMode('first_last', true, startEnd), 'start_end_frame')
    // First/last frame needs both frames; without references the request falls
    // back to a plain text-to-video command.
    assert.equal(resolveVideoGenerationMode('first_last', false, startEnd), 'text_to_video')
    assert.equal(resolveVideoGenerationMode('all_around', true, startEnd), 'image_to_video')
  })

  it('maps generation modes onto the app API operation', () => {
    assert.equal(generationOperationType('text_to_video'), 'text_to_video')
    assert.equal(generationOperationType('image_to_video'), 'image_to_video')
    assert.equal(generationOperationType('reference_to_video'), 'image_to_video')
    assert.equal(generationOperationType('start_end_frame'), 'image_to_video')
    assert.equal(generationOperationType('video_extend'), 'video_extend')
  })

  it('routes the submit and the estimate through the same operation', () => {
    assert.equal(
      resolveCreativeDispatch('video', { generationMode: 'start_end_frame' })?.operationType,
      'image_to_video',
    )
    assert.equal(
      resolveCreativeDispatch('video', { generationMode: 'text_to_video' })?.operationType,
      'text_to_video',
    )
    assert.equal(
      resolveCreativeDispatch('video', { hasReferenceImages: true })?.operationType,
      'image_to_video',
    )
    assert.equal(resolveCreativeDispatch('image')?.modality, 'image')
    // Agent mode keeps its assisted-image pricing behavior.
    assert.equal(resolveCreativeDispatch('agent')?.modality, 'image')
    assert.equal(resolveCreativeDispatch('unknown'), null)
  })

  it('lists only the composer modes a video model can dispatch', () => {
    const t2vOnly = {
      generationModes: ['text_to_video'],
      aspectRatios: ['16:9'],
      resolutions: ['720p'],
      duration: range,
      outputAudio: false,
    }
    assert.deepEqual(supportedVideoSettingsModes(t2vOnly), ['all_around'])
    assert.equal(supportedVideoSettingsModes(undefined), undefined)
    assert.deepEqual(supportedVideoResolutions(t2vOnly), ['720P'])
  })

  it('offers 智能 only to image models that accept an explicit size', () => {
    assert.deepEqual(
      supportedImageAspectRatios({ aspectRatios: ['1:1'], resolutions: ['1K'], customSize: true, maxCount: 1 }),
      ['智能', '1:1'],
    )
    assert.deepEqual(
      supportedImageAspectRatios({ aspectRatios: ['1:1'], resolutions: ['1K'], customSize: false, maxCount: 1 }),
      ['1:1'],
    )
    assert.equal(supportedImageAspectRatios(undefined), undefined)
  })

  it('omits the smart aspect ratio from the wire payload', () => {
    assert.equal(wireAspectRatio('智能'), undefined)
    assert.equal(wireAspectRatio(''), undefined)
    assert.equal(wireAspectRatio('16:9'), '16:9')
  })
})

describe('vendor parameter defaults', () => {
  it('bounds a remote-only image model by its vendor surface', () => {
    const openai = vendorDefaultParameters('image', 'openai')
    assert.equal(openai?.image?.maxCount, 4)
    assert.ok(openai?.image?.customSize)
    const kling = vendorDefaultParameters('image', 'kuaishou')
    assert.equal(kling?.image?.maxCount, 1)
    assert.equal(kling?.image?.customSize, false)
  })

  it('keeps an unprofiled video model on the modes every vendor supports', () => {
    const video = vendorDefaultParameters('video', 'kuaishou')
    assert.deepEqual(video?.video?.generationModes, ['text_to_video', 'image_to_video'])
    // Unknown ratios/resolutions/duration stay unconstrained instead of
    // inventing capabilities for a model the catalog has just published.
    assert.deepEqual(video?.video?.aspectRatios, [])
    assert.equal(video?.video?.duration, null)
  })

  it('falls back per remaining creation type', () => {
    assert.equal(vendorDefaultParameters('music', 'suno')?.music?.smartDuration, true)
    assert.ok((vendorDefaultParameters('voice', 'elevenlabs')?.voice?.voices.length ?? 0) > 0)
    assert.equal(vendorDefaultParameters('sound_effects', 'elevenlabs')?.sound_effects?.supportsLoop, true)
  })

  it('returns no parameters for an unknown vendor or a static-only type', () => {
    assert.equal(vendorDefaultParameters('video', 'runway'), undefined)
    assert.equal(vendorDefaultParameters('image', ''), undefined)
    assert.equal(vendorDefaultParameters('digital_human', 'kling'), undefined)
    assert.equal(vendorDefaultParameters('action', 'kling'), undefined)
  })
})

describe('runtime catalog video profiles', () => {
  const profiles = [
    {
      generationMode: 'text_to_video',
      resolution: '720p',
      aspectRatios: ['16:9', '9:16'],
      minDurationSeconds: 2,
      maxDurationSeconds: 12,
      durationStepSeconds: 1,
      outputAudio: true,
      isDefault: true,
    },
    {
      generationMode: 'image_to_video',
      resolution: '1080p',
      aspectRatios: ['16:9'],
      minDurationSeconds: 2,
      maxDurationSeconds: 12,
      durationStepSeconds: 1,
      outputAudio: true,
    },
    // Avatar belongs to the digital-human creation type, not the video picker.
    { generationMode: 'avatar', resolution: '720p', aspectRatios: [] },
  ]

  it('aggregates modes, resolution tiers, ratios and duration', () => {
    const video = videoParametersFromProfiles('bytedance', profiles)
    assert.deepEqual(video?.generationModes, ['text_to_video', 'image_to_video'])
    assert.deepEqual(video?.resolutions, ['720p', '1080p'])
    assert.deepEqual(video?.aspectRatios, ['16:9', '9:16'])
    assert.equal(video?.duration?.minSeconds, 2)
    assert.equal(video?.duration?.maxSeconds, 12)
    assert.equal(video?.duration?.stepSeconds, 1)
    assert.equal(video?.outputAudio, true)
  })

  it('keeps discrete durations and rejects vendors the adapter cannot dispatch', () => {
    const fixed = videoParametersFromProfiles('vidu', [
      { generationMode: 'text_to_video', resolution: '720p', durationSeconds: 5, isDefault: true },
      { generationMode: 'start_end_frame', resolution: '720p', durationSeconds: 10 },
    ])
    assert.deepEqual(fixed?.duration?.values, [5, 10])
    assert.equal(fixed?.duration?.defaultSeconds, 5)
    assert.equal(videoParametersFromProfiles('runway', profiles), undefined)
    assert.equal(videoParametersFromProfiles('bytedance', []), undefined)
  })

  it('offers discrete vendor durations as exact values, not a continuous range', () => {
    const discrete = videoParametersFromProfiles('openai', [
      {
        generationMode: 'text_to_video',
        resolution: '1080p',
        aspectRatios: ['16:9', '9:16'],
        durationPolicy: 'discrete',
        durationOptions: [4, 8, 12],
        minDurationSeconds: 4,
        maxDurationSeconds: 12,
      },
    ])
    assert.deepEqual(discrete?.duration?.values, [4, 8, 12])
    assert.equal(discrete?.duration?.minSeconds, 4)
    assert.equal(discrete?.duration?.maxSeconds, 12)
    assert.equal(discrete?.duration?.defaultSeconds, 4)
  })

  it('ignores knobs from profiles the video picker cannot dispatch', () => {    const video = videoParametersFromProfiles('kuaishou', [
      {
        generationMode: 'text_to_video',
        resolution: '1080p',
        aspectRatios: ['16:9'],
        durationPolicy: 'range',
        minDurationSeconds: 3,
        maxDurationSeconds: 15,
        durationStepSeconds: 1,
        outputAudio: true,
      },
      {
        generationMode: 'avatar',
        resolution: '720p',
        aspectRatios: ['1:1'],
        durationPolicy: 'continuous',
        minDurationSeconds: 2,
        maxDurationSeconds: 300,
        outputAudio: false,
      },
    ])
    assert.deepEqual(video?.generationModes, ['text_to_video'])
    assert.deepEqual(video?.aspectRatios, ['16:9'])
    assert.deepEqual(video?.resolutions, ['1080p'])
    assert.equal(video?.duration?.minSeconds, 3)
    assert.equal(video?.duration?.maxSeconds, 15)
    assert.equal(video?.outputAudio, true)
  })
})

describe('reference price labels', () => {
  const price = (
    meterCode: string,
    unitPrice: string,
    currency = 'CNY',
    regionCode = 'cn',
  ) => ({ meterCode, unitPrice, currency, regionCode })

  it('prefers the China region and the media meter over the per-request meter', () => {
    const chosen = preferredReferencePrice([
      price('api_result', '1'),
      price('video_output_second', '0.5'),
      price('video_output_second', '0.9', 'CNY', 'global'),
    ])
    assert.equal(chosen?.meterCode, 'video_output_second')
    assert.equal(chosen?.regionCode, 'cn')
    assert.equal(referencePriceLabel([price('api_result', '1'), price('video_output_second', '0.5')]), '¥0.5/秒')
  })

  it('trims trailing price decimals for compact rows', () => {
    assert.equal(referencePriceLabel([price('image_result', '0.100000')]), '¥0.1/张')
    assert.equal(referencePriceLabel([price('video_output_second', '1.000000')]), '¥1/秒')
    assert.equal(referencePriceLabel([price('image_result', '0.000000')]), undefined)
  })

  it('formats image and non-CNY prices with their unit and symbol', () => {
    assert.equal(referencePriceLabel([price('image_result', '0.2', 'USD', 'global')]), '$0.2/张')
    assert.equal(referencePriceLabel([price('tts_input_character', '0.01')]), '¥0.01/字符')
  })

  it('returns no label without a positive price', () => {
    assert.equal(referencePriceLabel([]), undefined)
    assert.equal(referencePriceLabel(undefined), undefined)
    assert.equal(referencePriceLabel([price('video_output_second', '0')]), undefined)
  })

  it('explains the reference price meter, unit and region in the tooltip', () => {
    const tooltip = referencePriceTooltip([price('video_output_second', '0.5')])
    assert.ok(tooltip?.includes('¥0.5/秒'))
    assert.ok(tooltip?.includes('video_output_second'))
    assert.ok(tooltip?.includes('cn'))
    assert.equal(referencePriceTooltip([]), undefined)
    assert.equal(referencePriceTooltip(undefined), undefined)
  })
})

describe('model card presentation helpers', () => {
  it('names each catalog vendor and falls back to the code', () => {
    assert.equal(vendorDisplayName('bytedance'), 'ByteDance')
    assert.equal(vendorDisplayName('kuaishou'), 'Kuaishou')
    assert.equal(vendorDisplayName(' OPENAI '), 'OpenAI')
    assert.equal(vendorDisplayName('runway'), 'runway')
    assert.equal(vendorDisplayName(undefined), '')
  })

  it('summarizes video capabilities as chips', () => {
    const chips = videoCapabilityChips({
      generationModes: ['text_to_video', 'reference_to_video', 'start_end_frame'],
      aspectRatios: ['16:9'],
      resolutions: ['720p'],
      duration: { minSeconds: 5, maxSeconds: 5, stepSeconds: 5, values: [5], defaultSeconds: 5 },
      outputAudio: true,
    })
    assert.deepEqual(chips, ['含音频', '首尾帧', '多参考', '固定时长'])
    assert.deepEqual(videoCapabilityChips(undefined), [])
    assert.deepEqual(
      videoCapabilityChips({
        generationModes: ['text_to_video'],
        aspectRatios: [],
        resolutions: [],
        duration: null,
        outputAudio: false,
      }),
      [],
    )
  })

  it('summarizes the numeric capabilities per creation type', () => {
    assert.equal(
      modelParameterSummary({
        video: {
          generationModes: ['text_to_video', 'image_to_video'],
          aspectRatios: ['16:9'],
          resolutions: ['480p', '720p', '1080p', '4k'],
          duration: { minSeconds: 2, maxSeconds: 12, stepSeconds: 1, values: [], defaultSeconds: 2 },
          outputAudio: true,
        },
      }, 'video'),
      '480P–4K · 2–12s',
    )
    assert.equal(
      modelParameterSummary({
        image: { aspectRatios: ['1:1'], resolutions: ['1K', '2K', '4K'], customSize: true, maxCount: 4 },
      }, 'image'),
      '1K–4K · 4 张',
    )
    assert.equal(
      modelParameterSummary({
        voice: { voices: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
      }, 'voice'),
      '2 个音色',
    )
    assert.equal(
      modelParameterSummary({
        sound_effects: {
          duration: { minSeconds: 0.5, maxSeconds: 22, stepSeconds: 0.5, values: [], defaultSeconds: 4 },
          supportsLoop: true,
        },
      }, 'sound_effects'),
      '0.5–22s',
    )
    assert.equal(modelParameterSummary(undefined, 'video'), undefined)
  })

  it('groups picker models by vendor in first-seen order', () => {
    const model = (
      id: string,
      vendorCode: string | undefined,
      order: number,
    ): CreativeModelDefinition => ({
      id,
      modality: 'video',
      label: id,
      desc: id,
      lifecycle: 'active',
      ...(vendorCode === undefined ? {} : { vendorCode }),
      source: 'static',
      order,
    })
    const groups = groupModelsByVendor([
      model('a', 'vidu', 0),
      model('b', 'kuaishou', 1),
      model('c', 'vidu', 2),
      model('d', undefined, 3),
    ])
    assert.deepEqual(groups.map((group) => group.vendorCode), ['vidu', 'kuaishou', '__unknown__'])
    assert.equal(groups[0].vendorLabel, 'Vidu')
    assert.equal(groups[1].vendorLabel, 'Kuaishou')
    assert.equal(groups[2].vendorLabel, '其他')
    assert.deepEqual(groups[0].models.map((entry) => entry.id), ['a', 'c'])
    assert.deepEqual(groups[2].models.map((entry) => entry.id), ['d'])
  })

  it('filters picker models by label, vendor, family and description', () => {
    const model: CreativeModelDefinition = {
      id: 'doubao-seedance-2-0-260128',
      modality: 'video',
      label: 'Doubao Seedance 2.0',
      desc: '字节跳动视频生成模型',
      familyCode: 'seedance',
      vendorCode: 'bytedance',
      lifecycle: 'active',
      source: 'static',
      order: 0,
    }
    assert.equal(modelMatchesSearch(model, ''), true)
    assert.equal(modelMatchesSearch(model, '  '), true)
    assert.equal(modelMatchesSearch(model, 'seedance'), true)
    assert.equal(modelMatchesSearch(model, 'DOUBAO'), true)
    assert.equal(modelMatchesSearch(model, '字节'), true)
    assert.equal(modelMatchesSearch(model, 'ByteDance'), true)
    assert.equal(modelMatchesSearch(model, 'bytedance 2.0'), true)
    assert.equal(modelMatchesSearch(model, 'bytedance 2.5'), false)
    assert.equal(modelMatchesSearch(model, 'kling'), false)
  })

  it('sorts catalog rows newest version first', () => {
    const row = (
      id: string,
      lifecycle: CreativeModelDefinition['lifecycle'] = 'active',
    ): CreativeModelDefinition => ({
      id,
      modality: 'video',
      label: id,
      desc: '',
      lifecycle,
      source: 'static',
      order: 0,
    })
    const order = (models: CreativeModelDefinition[]) =>
      sortModelsByRecency(models).map((model) => model.id)

    assert.deepEqual(
      order([row('kling-v2-6'), row('kling-v3'), row('kling-4.0')]),
      ['kling-4.0', 'kling-v3', 'kling-v2-6'],
    )
    assert.deepEqual(
      order([row('viduq3-pro'), row('viduq4-preview')]),
      ['viduq4-preview', 'viduq3-pro'],
    )
    assert.deepEqual(
      order([row('doubao-seedance-2-0-260128'), row('doubao-seedance-2-5-260628')]),
      ['doubao-seedance-2-5-260628', 'doubao-seedance-2-0-260128'],
    )
    assert.deepEqual(order([row('gpt-5'), row('gpt-5.5')]), ['gpt-5.5', 'gpt-5'])
    // Lifecycle dominates: a retired/newer build still sorts below an active one.
    assert.deepEqual(
      order([row('kling-v9', 'deprecated'), row('kling-v1')]),
      ['kling-v1', 'kling-v9'],
    )
    // Same version, different rebuild date: newer date first.
    assert.deepEqual(
      order([row('doubao-seedance-2-5-260623'), row('doubao-seedance-2-5-260628')]),
      ['doubao-seedance-2-5-260628', 'doubao-seedance-2-5-260623'],
    )
    // Equal versions keep the incoming order (stable sort).
    assert.deepEqual(
      order([row('viduq3-pro'), row('viduq3-turbo')]),
      ['viduq3-pro', 'viduq3-turbo'],
    )
  })

  it('normalizes agent language-model options from the app catalog', () => {
    const item = (overrides: Partial<RemoteCreativeModelItem>): RemoteCreativeModelItem => ({
      model: 'model',
      displayName: 'Model',
      vendorCode: 'openai',
      description: null,
      capabilityIntro: null,
      modalities: ['text'],
      outputModalities: ['text'],
      capabilities: ['chat'],
      releaseStage: 1,
      shelfState: 1,
      routingState: 1,
      replacementModel: null,
      ...overrides,
    })
    const models = toAgentLlmModels([
      item({ model: 'gpt-5.5', displayName: 'GPT-5.5', description: 'flagship' }),
      item({ model: 'gpt-5.5', displayName: 'GPT-5.5 duplicate' }),
      item({ model: 'gemini-3.6-flash', displayName: 'Gemini 3.6 Flash', vendorCode: 'google' }),
      item({
        model: 'kling-image',
        displayName: 'Kling Image',
        vendorCode: 'kuaishou',
        outputModalities: ['image'],
        capabilities: ['image'],
      }),
    ])
    assert.deepEqual(models.map((model) => model.id), ['gemini-3.6-flash', 'gpt-5.5'])
    assert.equal(models[0].vendorLabel, 'Google')
    assert.equal(models[1].vendorLabel, 'OpenAI')
    assert.equal(models[1].desc, 'flagship')
  })
})
