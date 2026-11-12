/**
 * Static baseline catalog.
 *
 * Seeded from the `sdkwork-models` repository catalog (`models/` +
 * `catalogVersion`) and materialized at build time. This is the default data
 * source for every creation mode: it works offline and before the first remote
 * sync. The remote sync layer may add, update, deprecate or remove models on top
 * of this baseline (see creativeModelCatalogService).
 *
 * Every entry is a real catalog model plus the vendor code the generations
 * command plane forwards as `parameters.vendor`, and only vendors the provider
 * adapter can dispatch appear. `parameters` carries the knobs the model
 * accepts (video modes / ratios / resolutions / duration, image size tiers,
 * music length, speech voices, sound-effect length): the picker offers only
 * those values, and the command carries only what the selected model supports.
 *
 * Source: sdkwork-models catalog 2026.11.01.1 (generatedAt 2026-11-01T00:00:00Z).
 * Regenerate with `node scripts/generate-creative-model-catalog.mjs`; do not edit by hand.
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

export const STATIC_CREATIVE_MODEL_CATALOG_VERSION = '2026.11.01.1';

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

export const STATIC_IMAGE_MODELS: CreativeModelDefinition[] = [
  staticModel(
    'image',
    0,
    {
      id: 'gemini-3-pro-image',
      label: 'Gemini 3 Pro Image',
      desc: 'Gemini 3 Pro Image generates high-quality images from text prompts with strong instruction following.',
      vendorCode: 'google',
      parameters: {
        image: {
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
          resolutions: ['1K'],
          customSize: false,
          maxCount: 4
        }
      },
    },
  ),
  staticModel(
    'image',
    1,
    {
      id: 'gpt-image-2',
      label: 'GPT Image 2',
      desc: 'Current OpenAI image generation and editing model.',
      vendorCode: 'openai',
      parameters: {
        image: {
          aspectRatios: ['1:1', '3:2', '2:3', '16:9', '9:16'],
          resolutions: ['1K', '2K', '4K'],
          customSize: true,
          maxCount: 4
        }
      },
    },
  ),
  staticModel(
    'image',
    2,
    {
      id: 'kling-image-3.0-omni',
      label: 'Kling Image 3.0 Omni',
      desc: 'Kling Image 3.0 Omni：官方图片价目表确认在售，1K/2K 每张 0.2 元、4K 每张 0.4 元。',
      vendorCode: 'kuaishou',
      parameters: {
        image: {
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
          resolutions: ['1K'],
          customSize: false,
          maxCount: 1
        }
      },
    },
  ),
  staticModel(
    'image',
    3,
    {
      id: 'kling-image-3.0',
      label: 'Kling Image 3.0',
      desc: 'Kling Image 3.0：官方图片价目表确认在售，1K/2K 每张 0.2 元。',
      vendorCode: 'kuaishou',
      parameters: {
        image: {
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
          resolutions: ['1K'],
          customSize: false,
          maxCount: 1
        }
      },
    },
  ),
  staticModel(
    'image',
    4,
    {
      id: 'viduq2',
      label: 'Vidu Q2 Image',
      desc: 'Vidu Q2 image model served by `POST /ent/v2/reference2image`. One surface covers text-to-image (no `images`), image editing, and reference-to-image (1-7 refe...',
      vendorCode: 'vidu',
      parameters: {
        image: {
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
          resolutions: ['1K', '2K', '4K'],
          customSize: false,
          maxCount: 1
        }
      },
    },
  ),
  staticModel(
    'image',
    5,
    {
      id: 'doubao-seedream-5-0-pro-260628',
      label: 'Doubao Seedream 5.0 Pro',
      desc: 'ByteDance Doubao Seedream 5.0 Pro image generation model released 2026-07-08, current Seedream flagship.',
      vendorCode: 'bytedance',
      parameters: {
        image: {
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
          resolutions: ['1K', '2K', '4K'],
          customSize: true,
          maxCount: 4
        }
      },
    },
  ),
  staticModel(
    'image',
    6,
    {
      id: 'kling-image-o1',
      label: 'Kling Image O1',
      desc: 'Kling Image O1：官方图片能力地图标注「高特征一致性，精准细节修改，风格迁移准确」，支持文生图与图生图，1K/2K。',
      vendorCode: 'kuaishou',
      parameters: {
        image: {
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
          resolutions: ['1K'],
          customSize: false,
          maxCount: 1
        }
      },
    },
  ),
  staticModel(
    'image',
    7,
    {
      id: 'kling-v2-1',
      label: 'Kling Image 2.1',
      desc: 'Kling Image 2.1：官方图片能力地图标注「指令遵循强，文字强化，出图稳定」，1K/2K，含多图参考生图档位。',
      vendorCode: 'kuaishou',
      parameters: {
        image: {
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
          resolutions: ['1K'],
          customSize: false,
          maxCount: 1
        }
      },
    },
  ),
  staticModel(
    'image',
    8,
    {
      id: 'viduq1',
      label: 'Vidu Q1 Image',
      desc: 'Vidu Q1 reference-to-image model served by `POST /ent/v2/reference2image`. It requires at least one reference image and supports 1080p only, so it is the che...',
      vendorCode: 'vidu',
      parameters: {
        image: {
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
          resolutions: ['1K', '2K', '4K'],
          customSize: false,
          maxCount: 1
        }
      },
    },
  ),
  staticModel(
    'image',
    9,
    {
      id: 'doubao-seedream-5-0-flash-260915',
      label: 'Doubao Seedream 5.0 Flash',
      desc: 'Doubao Seedream 5.0 Flash 260915 on Volcengine Ark, listed under 推荐模型 for image generation: single-image generation, text-to-image, single image-to-image and...',
      vendorCode: 'bytedance',
      parameters: {
        image: {
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
          resolutions: ['1K', '2K', '4K'],
          customSize: true,
          maxCount: 4
        }
      },
    },
  ),
  staticModel(
    'image',
    10,
    {
      id: 'gemini-3.1-flash-lite-image',
      label: 'Gemini 3.1 Flash Lite Image (Nano Banana 2 Lite)',
      desc: 'Nano Banana 2 Lite，面向超低延迟与低成本图像生成/编辑，2026-06-30 GA。',
      vendorCode: 'google',
      parameters: {
        image: {
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
          resolutions: ['1K'],
          customSize: false,
          maxCount: 4
        }
      },
    },
  ),
  staticModel(
    'image',
    11,
    {
      id: 'gemini-nano-banana-2.1',
      label: 'Gemini Nano Banana 2.1',
      desc: 'Nano Banana 2.1 (successor to Nano Banana 2 / gemini-3.1-flash-image), high-efficiency image generation and conversational editing; GA 2026-10-06; improved v...',
      vendorCode: 'google',
      parameters: {
        image: {
          aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
          resolutions: ['1K'],
          customSize: false,
          maxCount: 4
        }
      },
    },
  ),
  staticModel(
    'image',
    12,
    {
      id: 'gpt-image-2.5-flare',
      label: 'GPT Image 2.5 Flare',
      desc: 'Fast, high-quality everyday image generation.',
      vendorCode: 'openai',
      parameters: {
        image: {
          aspectRatios: ['1:1', '3:2', '2:3', '16:9', '9:16'],
          resolutions: ['1K', '2K', '4K'],
          customSize: true,
          maxCount: 4
        }
      },
    },
  ),
  staticModel(
    'image',
    13,
    {
      id: 'gpt-image-2.5-sunburst',
      label: 'GPT Image 2.5 Sunburst',
      desc: 'Our most capable model for image generation and editing.',
      vendorCode: 'openai',
      parameters: {
        image: {
          aspectRatios: ['1:1', '3:2', '2:3', '16:9', '9:16'],
          resolutions: ['1K', '2K', '4K'],
          customSize: true,
          maxCount: 4
        }
      },
    },
  ),
];

export const STATIC_VIDEO_MODELS: CreativeModelDefinition[] = [
  staticModel(
    'video',
    0,
    {
      id: 'viduq3-pro',
      label: 'Vidu Q3 Pro',
      desc: 'Vidu Q3 Pro flagship model for text-to-video, image-to-video, and start-end frame generation with native audio up to 1080p.',
      vendorCode: 'vidu',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video', 'start_end_frame'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['540p', '720p', '1080p'],
          duration: {
            minSeconds: 5,
            maxSeconds: 10,
            stepSeconds: 5,
            values: [5, 10],
            defaultSeconds: 5
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    1,
    {
      id: 'kling-3.0-turbo',
      label: 'Kling 3.0 Turbo',
      desc: 'Kling 3.0 Turbo：官方能力地图标注「效果稳定出色，性价比更优」，支持 3~15s、720P/1080P 的单镜头视频生成与音画同出。',
      vendorCode: 'kuaishou',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['1080p'],
          duration: {
            minSeconds: 3,
            maxSeconds: 15,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 3
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    2,
    {
      id: 'kling-video-o1',
      label: 'Kling O1',
      desc: 'Kling O1 大一统视频模型：全能多模态指令输入，生成 3~10s、720P/1080P 视频，参考视频输入另按更高档位计价。',
      vendorCode: 'kuaishou',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['1080p'],
          duration: {
            minSeconds: 3,
            maxSeconds: 15,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 3
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    3,
    {
      id: 'viduq3-mix',
      label: 'Vidu Q3 Mix',
      desc: 'Vidu Q3 Mix text-to-video and reference-to-video base tier with 16-bit HDR motion, CN pricing.',
      vendorCode: 'vidu',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['720p'],
          duration: {
            minSeconds: 5,
            maxSeconds: 10,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 5
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    4,
    {
      id: 'viduq3-turbo',
      label: 'Vidu Q3 Turbo',
      desc: 'Vidu Q3 Turbo for faster video generation with lower credit cost than Q3 Pro.',
      vendorCode: 'vidu',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['540p', '720p', '1080p'],
          duration: {
            minSeconds: 5,
            maxSeconds: 10,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 5
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    5,
    {
      id: 'kling-v3-omni',
      label: 'Kling v3 Omni',
      desc: 'Kling Video 3.0 Omni unified multimodal video generation and editing with reference video, elements, and multi-shot direction.',
      vendorCode: 'kuaishou',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['1080p'],
          duration: {
            minSeconds: 3,
            maxSeconds: 15,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 3
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    6,
    {
      id: 'kling-v3',
      label: 'Kling v3',
      desc: 'Kling Video 3.0 cinematic video generation with native audio, multi-shot storyboarding, and up to 15 second output.',
      vendorCode: 'kuaishou',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['720p', '1080p', '4k'],
          duration: {
            minSeconds: 2,
            maxSeconds: 300,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 3
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    7,
    {
      id: 'kling-v2-6',
      label: 'Kling 2.6',
      desc: 'Kling 2.6：官方能力地图标注「音画同步生成，有声音更精彩」，支持 3~10s、720P/1080P，含动作控制与指定音色。',
      vendorCode: 'kuaishou',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['720p', '1080p'],
          duration: {
            minSeconds: 3,
            maxSeconds: 15,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 3
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    8,
    {
      id: 'kling-v2-5-turbo',
      label: 'Kling 2.5 Turbo',
      desc: 'Kling 2.5 Turbo：官方能力地图标注「超绝想象力，极具性价比」，文本/图片输入，5s 或 10s、720P/1080P 输出。',
      vendorCode: 'kuaishou',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['720p', '1080p'],
          duration: {
            minSeconds: 3,
            maxSeconds: 15,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 3
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    9,
    {
      id: 'doubao-seedance-2-0-260128',
      label: 'Doubao Seedance 2.0',
      desc: 'ByteDance Seedance 2.0 video generation model with unified multimodal audio-video output.',
      vendorCode: 'bytedance',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['720p'],
          duration: {
            minSeconds: 2,
            maxSeconds: 12,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 2
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    10,
    {
      id: 'doubao-seedance-2-0-fast-260128',
      label: 'Doubao Seedance 2.0 Fast',
      desc: 'ByteDance Seedance 2.0 fast video generation model for lower-latency iteration.',
      vendorCode: 'bytedance',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video', 'reference_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['720p'],
          duration: {
            minSeconds: 2,
            maxSeconds: 12,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 2
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    11,
    {
      id: 'doubao-seedance-2-0-mini-260615',
      label: 'Doubao Seedance 2.0 Mini',
      desc: 'Doubao Seedance 2.0 Mini on Volcengine Ark (480p/720p 8-bit, 24 fps, 4-15s), the low-cost tier of the Seedance 2.0 series.',
      vendorCode: 'bytedance',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video', 'reference_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['480p', '720p'],
          duration: {
            minSeconds: 2,
            maxSeconds: 12,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 2
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    12,
    {
      id: 'doubao-seedance-2-5-260628',
      label: 'Doubao Seedance 2.5 (260628)',
      desc: 'Doubao Seedance 2.5 260628 revision, the only Seedance 2.5 id on the Volcengine Ark model list (480p/720p 8-bit, 1080p 10-bit, 24 fps, 4-30s). Replaces the p...',
      vendorCode: 'bytedance',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video', 'reference_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['480p', '720p', '1080p'],
          duration: {
            minSeconds: 2,
            maxSeconds: 12,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 2
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    13,
    {
      id: 'dreamina-seedance-2-0-260128',
      label: 'Dreamina Seedance 2.0',
      desc: 'BytePlus ModelArk Seedance 2.0. 480p/720p/1080p 8-bit and 4K 10-bit, 24 fps, 4-15s.',
      vendorCode: 'bytedance',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video', 'reference_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['480p', '720p', '1080p', '4k'],
          duration: {
            minSeconds: 2,
            maxSeconds: 12,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 2
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    14,
    {
      id: 'dreamina-seedance-2-0-fast-260128',
      label: 'Dreamina Seedance 2.0 Fast',
      desc: 'BytePlus ModelArk Seedance 2.0 Fast. 480p/720p 8-bit, 24 fps, 4-15s.',
      vendorCode: 'bytedance',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video', 'reference_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['480p', '720p'],
          duration: {
            minSeconds: 2,
            maxSeconds: 12,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 2
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    15,
    {
      id: 'dreamina-seedance-2-0-mini-260615',
      label: 'Dreamina Seedance 2.0 Mini',
      desc: 'BytePlus ModelArk Seedance 2.0 Mini. 480p/720p 8-bit, 24 fps, 4-15s.',
      vendorCode: 'bytedance',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video', 'reference_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['480p', '720p'],
          duration: {
            minSeconds: 2,
            maxSeconds: 12,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 2
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    16,
    {
      id: 'dreamina-seedance-2-5-260628',
      label: 'Dreamina Seedance 2.5',
      desc: 'BytePlus ModelArk mainline video generation model. 480p/720p 8-bit and 1080p 10-bit, 24 fps, 4-30s, .mp4/.mov output.',
      vendorCode: 'bytedance',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video', 'reference_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['480p', '720p', '1080p'],
          duration: {
            minSeconds: 2,
            maxSeconds: 12,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 2
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    17,
    {
      id: 'gemini-omni-1.1-flash',
      label: 'Gemini Omni 1.1 Flash',
      desc: 'Google Gemini Omni 1.1 Flash video generation model generally available since 2026-08-27, successor to the Omni Flash preview.',
      vendorCode: 'google',
      parameters: {
        video: {
          generationModes: ['text_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['720p'],
          duration: {
            minSeconds: 5,
            maxSeconds: 8,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 5
          },
          outputAudio: false
        }
      },
    },
  ),
  staticModel(
    'video',
    18,
    {
      id: 'kling-4.0',
      label: 'Kling 4.0',
      desc: '新一代原生多模态 AI 视频创作大模型，官方公告已全量上线并开放 API 接入。30 秒视频原生直出，大幅度动态表现更稳定，全能参考（图片/视频/主体/音色最多 15 项自由组合），最多 10 张关键帧精准控制，支持创意复刻与对已有成片精准局部修改。官方能力地图参数：输入文本/图片/视频，时长 3~30s，分辨率...',
      vendorCode: 'kuaishou',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['1080p'],
          duration: {
            minSeconds: 3,
            maxSeconds: 15,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 3
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    19,
    {
      id: 'viduq3',
      label: 'Vidu Q3',
      desc: 'Vidu Q3 基座模型（参考生视频，3-16 秒，540p/720p/1080p，默认 720p、默认 5 秒，默认 audio=true）。官方「模型地图」未列出该 id，但定价页「参考生视频」积分表与接口参数「模型名称可选值：viduq3-mix、viduq3-turbo、viduq3、…」均给出 vidu...',
      vendorCode: 'vidu',
      parameters: {
        video: {
          generationModes: ['text_to_video', 'image_to_video', 'reference_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['720p'],
          duration: {
            minSeconds: 5,
            maxSeconds: 10,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 5
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    20,
    {
      id: 'viduq3-pro-fast',
      label: 'Vidu Q3 Pro Fast',
      desc: 'Vidu Q3 Pro 的加速变体。官方定价表「ViduQ3」段仅列出图生视频能力（1-16 秒，1080P/720P），并给出错峰积分消耗。',
      vendorCode: 'vidu',
      parameters: {
        video: {
          generationModes: ['image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['720p', '1080p'],
          duration: {
            minSeconds: 5,
            maxSeconds: 10,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 5
          },
          outputAudio: true
        }
      },
    },
  ),
  staticModel(
    'video',
    21,
    {
      id: 'viduq4-preview',
      label: 'Vidu Q4 Preview',
      desc: 'Vidu Q4 系列首发预览模型 viduq4-preview：图生视频、参考生视频，3–16 秒可选，540p/720p/1080p/2K/4K，24fps；官方介绍「价格超省，传神演技，形声入戏张力镜头，燃魂特效」。定价页按秒积分计费（1 积分 = ¥0.03125，官方积分单价表）。',
      vendorCode: 'vidu',
      parameters: {
        video: {
          generationModes: ['image_to_video'],
          aspectRatios: ['16:9', '1:1', '9:16'],
          resolutions: ['540p', '720p', '1080p', '2k', '4k'],
          duration: {
            minSeconds: 5,
            maxSeconds: 10,
            stepSeconds: 1,
            values: [],
            defaultSeconds: 5
          },
          outputAudio: true
        }
      },
    },
  ),
];

export const STATIC_MUSIC_MODELS: CreativeModelDefinition[] = [
  staticModel(
    'music',
    0,
    {
      id: 'suno-v6',
      label: 'Suno v6',
      desc: 'Suno\'s top-tier advanced music model, available to Pro and Premier subscribers. Officially listed next to v6-wild as one of Suno\'s two advanced models; no of...',
      vendorCode: 'suno',
      lifecycle: 'preview',
      isNew: true,
      parameters: {
        music: {
          duration: {
            minSeconds: 5,
            maxSeconds: 300,
            stepSeconds: 5,
            values: [],
            defaultSeconds: 120
          },
          smartDuration: true
        }
      },
    },
  ),
  staticModel(
    'music',
    1,
    {
      id: 'suno-v6-wild',
      label: 'Suno v6 Wild',
      desc: 'Suno\'s top-tier advanced music model offered alongside v6 to Pro and Premier subscribers. No official API price is published, so no price row is recorded.',
      vendorCode: 'suno',
      lifecycle: 'preview',
      isNew: true,
      parameters: {
        music: {
          duration: {
            minSeconds: 5,
            maxSeconds: 300,
            stepSeconds: 5,
            values: [],
            defaultSeconds: 120
          },
          smartDuration: true
        }
      },
    },
  ),
  staticModel(
    'music',
    2,
    {
      id: 'suno-v6-mini',
      label: 'Suno v6 Mini',
      desc: 'Suno\'s faster, more efficient model available to free users and officially listed as the best free model on the plans comparison. No official API price is pu...',
      vendorCode: 'suno',
      lifecycle: 'preview',
      isNew: true,
      parameters: {
        music: {
          duration: {
            minSeconds: 5,
            maxSeconds: 300,
            stepSeconds: 5,
            values: [],
            defaultSeconds: 120
          },
          smartDuration: true
        }
      },
    },
  ),
];

export const STATIC_VOICE_MODELS: CreativeModelDefinition[] = [
  staticModel(
    'voice',
    0,
    {
      id: 'eleven_flash_v2_5',
      label: 'Eleven Flash v2.5',
      desc: 'ElevenLabs Flash v2.5 ultra-low latency text-to-speech model.',
      vendorCode: 'elevenlabs',
      parameters: {
        voice: {
          voices: [
            {
              id: '21m00Tcm4TlvDq8ikWAM',
              label: 'Rachel（女声）'
            },
            {
              id: 'EXAVITQu4vr4xnSDxMaL',
              label: 'Bella（女声）'
            },
            {
              id: 'AZnzlk1XvdvUeBnXmlld',
              label: 'Domi（女声）'
            },
            {
              id: 'pNInz6obpgDQGcFmaJgB',
              label: 'Adam（男声）'
            }
          ]
        }
      },
    },
  ),
  staticModel(
    'voice',
    1,
    {
      id: 'eleven_multilingual_v2',
      label: 'Eleven Multilingual v2',
      desc: 'ElevenLabs Multilingual v2 lifelike text-to-speech model with rich emotional expression.',
      vendorCode: 'elevenlabs',
      parameters: {
        voice: {
          voices: [
            {
              id: '21m00Tcm4TlvDq8ikWAM',
              label: 'Rachel（女声）'
            },
            {
              id: 'EXAVITQu4vr4xnSDxMaL',
              label: 'Bella（女声）'
            },
            {
              id: 'AZnzlk1XvdvUeBnXmlld',
              label: 'Domi（女声）'
            },
            {
              id: 'pNInz6obpgDQGcFmaJgB',
              label: 'Adam（男声）'
            }
          ]
        }
      },
    },
  ),
  staticModel(
    'voice',
    2,
    {
      id: 'eleven_v3',
      label: 'Eleven v3',
      desc: 'ElevenLabs v3 expressive text-to-speech model with dialogue and multilingual support.',
      vendorCode: 'elevenlabs',
      parameters: {
        voice: {
          voices: [
            {
              id: '21m00Tcm4TlvDq8ikWAM',
              label: 'Rachel（女声）'
            },
            {
              id: 'EXAVITQu4vr4xnSDxMaL',
              label: 'Bella（女声）'
            },
            {
              id: 'AZnzlk1XvdvUeBnXmlld',
              label: 'Domi（女声）'
            },
            {
              id: 'pNInz6obpgDQGcFmaJgB',
              label: 'Adam（男声）'
            }
          ]
        }
      },
    },
  ),
  staticModel(
    'voice',
    3,
    {
      id: 'seed-tts-2.0-expressive',
      label: 'Seed TTS 2.0 Expressive',
      desc: 'Doubao Seed TTS 2.0 expressive voice synthesis with QA and voice-tag control.',
      vendorCode: 'bytedance',
      parameters: {
        voice: {
          voices: [
            {
              id: 'zh_female_cancan_mars',
              label: '灿灿（女声）'
            }
          ]
        }
      },
    },
  ),
  staticModel(
    'voice',
    4,
    {
      id: 'seed-tts-2.0-standard',
      label: 'Seed TTS 2.0 Standard',
      desc: 'Doubao Seed TTS 2.0 standard voice synthesis with low latency via Volcengine speech API.',
      vendorCode: 'bytedance',
      parameters: {
        voice: {
          voices: [
            {
              id: 'zh_female_cancan_mars',
              label: '灿灿（女声）'
            }
          ]
        }
      },
    },
  ),
];

export const STATIC_SOUND_EFFECT_MODELS: CreativeModelDefinition[] = [
  staticModel(
    'sound_effects',
    0,
    {
      id: 'eleven_text_to_sound_v2',
      label: 'Eleven Text to Sound v2',
      desc: 'ElevenLabs Text to Sound v2 for cinematic sound-effect generation from text prompts with up to 30 seconds output.',
      vendorCode: 'elevenlabs',
      parameters: {
        sound_effects: {
          duration: {
            minSeconds: 0.5,
            maxSeconds: 22,
            stepSeconds: 0.5,
            values: [],
            defaultSeconds: 4
          },
          supportsLoop: true
        }
      },
    },
  ),
];

export const STATIC_DIGITAL_HUMAN_MODELS: CreativeModelDefinition[] = [
  staticModel(
    'digital_human',
    0,
    {
      id: 'master_mode',
      label: '大师模式',
      desc: '电影级的表演效果',
      vendorCode: 'kling',
      spark: true,
    },
  ),
  staticModel(
    'digital_human',
    1,
    {
      id: 'fast_mode',
      label: '快速模式',
      desc: '更低成本，快速生成',
      vendorCode: 'kling',
    },
  ),
  staticModel(
    'digital_human',
    2,
    {
      id: 'basic_mode',
      label: '基础模式',
      desc: '仅仅修改人物口型。适合演讲、对白',
      vendorCode: 'kling',
    },
  ),
];

export const STATIC_ACTION_MODELS: CreativeModelDefinition[] = [
  staticModel(
    'action',
    0,
    {
      id: 'master',
      label: '大师',
      desc: '效果最佳，画质超清',
      vendorCode: 'kling',
      spark: true,
      isNew: true,
    },
  ),
  staticModel(
    'action',
    1,
    {
      id: 'vivid',
      label: '生动',
      desc: '不限画幅，动效更真',
      vendorCode: 'kling',
      isNew: true,
    },
  ),
  staticModel(
    'action',
    2,
    {
      id: 'fast',
      label: '快速',
      desc: '更快生成，成本更低',
      vendorCode: 'kling',
      isNew: true,
    },
  ),
];

export const STATIC_CREATIVE_MODELS: Readonly<
  Record<CreativeModelModality, readonly CreativeModelDefinition[]>
> = Object.freeze({
  image: STATIC_IMAGE_MODELS,
  video: STATIC_VIDEO_MODELS,
  music: STATIC_MUSIC_MODELS,
  voice: STATIC_VOICE_MODELS,
  sound_effects: STATIC_SOUND_EFFECT_MODELS,
  digital_human: STATIC_DIGITAL_HUMAN_MODELS,
  action: STATIC_ACTION_MODELS,
});

/** Default selection per modality (first entry of each static catalog). */
export const STATIC_DEFAULT_MODEL_IDS: Readonly<
  Record<CreativeModelModality, string>
> = Object.freeze({
  image: 'gemini-3-pro-image',
  video: 'viduq3-pro',
  music: 'suno-v6',
  voice: 'eleven_flash_v2_5',
  sound_effects: 'eleven_text_to_sound_v2',
  digital_human: 'master_mode',
  action: 'master',
});

/**
 * Catalog selection rule per creation type.
 *
 * `capability` and `outputModalities` scope the picker to models that produce
 * this creation type; `vendorCodes` keeps only catalog vendors the generations
 * provider adapter dispatches. `null` means static-only.
 */
export const CREATIVE_MODEL_SELECTION_PROFILES: Readonly<
  Record<CreativeModelModality, CreativeModelSelectionProfile | null>
> = Object.freeze({
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
    excludedModelIdTokens: ['realtime'],
  },
  sound_effects: {
    capability: 'sfx',
    queryCapabilities: [],
    outputModalities: ['audio'],
    vendorCodes: ['elevenlabs'],
    excludedModelIdTokens: [],
  },
  digital_human: null,
  action: null,
});

/** Creative modalities the remote sync covers, in deterministic order. */
export const REMOTE_SYNC_MODALITIES: readonly CreativeModelModality[] = [
  'image',
  'video',
  'music',
  'voice',
  'sound_effects',
];

/**
 * Per-vendor parameter defaults.
 *
 * The remote sync can list a catalog model this file does not carry yet (a
 * model published after the last regeneration). Its wire row carries no
 * parameter profile, so the picker falls back to the vendor surface policy
 * below instead of offering every knob at once.
 */
export const VENDOR_IMAGE_PARAMETERS: Readonly<Record<string, CreativeModelImageParameters>> = {
  openai: {
    aspectRatios: ['1:1', '3:2', '2:3', '16:9', '9:16'],
    resolutions: ['1K', '2K', '4K'],
    customSize: true,
    maxCount: 4
  },
  bytedance: {
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
    resolutions: ['1K', '2K', '4K'],
    customSize: true,
    maxCount: 4
  },
  kuaishou: {
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
    resolutions: ['1K'],
    customSize: false,
    maxCount: 1
  },
  vidu: {
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
    resolutions: ['1K', '2K', '4K'],
    customSize: false,
    maxCount: 1
  },
  google: {
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'],
    resolutions: ['1K'],
    customSize: false,
    maxCount: 4
  }
};

export const VENDOR_MUSIC_PARAMETERS: Readonly<Record<string, CreativeModelMusicParameters>> = {
  suno: {
    duration: {
      minSeconds: 5,
      maxSeconds: 300,
      stepSeconds: 5,
      values: [],
      defaultSeconds: 120
    },
    smartDuration: true
  },
  minimax: {
    duration: null,
    smartDuration: false
  }
};

export const VENDOR_VOICE_PARAMETERS: Readonly<Record<string, CreativeModelVoiceParameters>> = {
  elevenlabs: {
    voices: [
      {
        id: '21m00Tcm4TlvDq8ikWAM',
        label: 'Rachel（女声）'
      },
      {
        id: 'EXAVITQu4vr4xnSDxMaL',
        label: 'Bella（女声）'
      },
      {
        id: 'AZnzlk1XvdvUeBnXmlld',
        label: 'Domi（女声）'
      },
      {
        id: 'pNInz6obpgDQGcFmaJgB',
        label: 'Adam（男声）'
      }
    ]
  },
  bytedance: {
    voices: [
      {
        id: 'zh_female_cancan_mars',
        label: '灿灿（女声）'
      }
    ]
  }
};

export const VENDOR_SFX_PARAMETERS: Readonly<Record<string, CreativeModelSfxParameters>> = {
  elevenlabs: {
    duration: {
      minSeconds: 0.5,
      maxSeconds: 22,
      stepSeconds: 0.5,
      values: [],
      defaultSeconds: 4
    },
    supportsLoop: true
  }
};

/** Conservative generation modes for an unprofiled model of each video vendor. */
export const VENDOR_VIDEO_GENERATION_MODES: Readonly<Record<string, readonly string[]>> = {
  openai: ['text_to_video', 'image_to_video'],
  google: ['text_to_video'],
  kuaishou: ['text_to_video', 'image_to_video'],
  vidu: ['text_to_video', 'image_to_video'],
  bytedance: ['text_to_video', 'image_to_video']
};

/**
 * Full composer generation modes the adapter dispatches per video vendor.
 * Runtime catalog profiles are intersected with this set, the same way these
 * static profiles were generated.
 */
export const VENDOR_VIDEO_ADAPTER_MODES: Readonly<Record<string, readonly string[]>> = {
  openai: ['text_to_video', 'image_to_video'],
  google: ['text_to_video'],
  kuaishou: ['text_to_video', 'image_to_video', 'start_end_frame'],
  vidu: ['text_to_video', 'image_to_video', 'reference_to_video', 'start_end_frame'],
  bytedance: ['text_to_video', 'image_to_video', 'reference_to_video', 'start_end_frame']
};
