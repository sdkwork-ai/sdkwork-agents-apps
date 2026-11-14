import { useState, useRef, useEffect, useMemo } from 'react';

import {
  readAccountScopedItem,
  removeAccountScopedItem,
  writeAccountScopedItem,
} from '@sdkwork/agents-pc-core/session';

import {
  clampDurationSeconds,
  resolveVideoGenerationMode,
  supportedImageAspectRatios,
  supportedVideoAspectRatios,
  supportedVideoResolutions,
  supportedVideoSettingsModes,
  useCreativeModelCatalog,
  type CreativeVideoSettingsMode,
} from '../creative-model-catalog';
import { useAgentLlmModels } from './useAgentLlmModels';
import { imageDimensionsFor } from '../components/creative/imageDimensions';

/** Account-scoped draft key (see `@sdkwork/agents-pc-core/session`). */
const CREATIVE_INPUT_DRAFT_KEY = 'creative_input_draft';
/** Account-scoped agent orchestration model key. */
const AGENT_LLM_MODEL_KEY = 'creative_agent_llm_model';
/** Preferred agent model when the catalog publishes it. */
const PREFERRED_AGENT_LLM_MODEL_ID = 'gemini-3.6-flash';

export interface CreativeInputSettings {
  model?: string;
  ratio?: string;
  resolution?: string;
  duration?: number;
  videoMode?: 'all_around' | 'first_last' | 'smart_multi';
  /** Precise generation mode submitted as `parameters.generationMode`. */
  generationMode?: string;
  /** Agent-mode orchestration model (`parameters.agentModel`). */
  agentLlmModel?: string;
  /** Media models the agent may use for image generation. */
  agentImageModels?: string[];
  /** Media models the agent may use for video generation. */
  agentVideoModels?: string[];
  /** Selected vendor voice id for speech synthesis. */
  voiceId?: string;
  /** Seamless looping for sound effects. */
  loop?: boolean;
  /** Whether the generated video carries synchronized audio. */
  audio?: boolean;
  count?: number;
  imageWidth?: number;
  imageHeight?: number;
}

export function useCreativeInputBox(
  defaultValue: string = '', 
  initialMode?: string, 
  initialSettings?: CreativeInputSettings, 
  onSettingsChange?: (settings: any) => void
) {
  const [input, setInput] = useState(() => {
    if (defaultValue) return defaultValue;
    return readAccountScopedItem(CREATIVE_INPUT_DRAFT_KEY) ?? '';
  });

  useEffect(() => {
    if (input) {
      writeAccountScopedItem(CREATIVE_INPUT_DRAFT_KEY, input);
    } else {
      removeAccountScopedItem(CREATIVE_INPUT_DRAFT_KEY);
    }
  }, [input]);
  const [creationType, setCreationType] = useState(initialMode || 'video'); // Default to video based on prompt
  // Unified model catalog: every modality resolves its selection through the
  // shared service (static sdkwork-models baseline + remote sync layer).
  const imageCatalog = useCreativeModelCatalog('image', { initialModelId: initialSettings?.model });
  const videoCatalog = useCreativeModelCatalog('video', { initialModelId: initialSettings?.model });
  const musicCatalog = useCreativeModelCatalog('music', { initialModelId: initialSettings?.model });
  const voiceCatalog = useCreativeModelCatalog('voice', { initialModelId: initialSettings?.model });
  const soundEffectsCatalog = useCreativeModelCatalog('sound_effects', { initialModelId: initialSettings?.model });
  const digitalHumanCatalog = useCreativeModelCatalog('digital_human', { initialModelId: initialSettings?.model });
  const actionCatalog = useCreativeModelCatalog('action', { initialModelId: initialSettings?.model });
  const selectedImageModel = imageCatalog.selectedModelId;
  const setSelectedImageModel = imageCatalog.selectModel;
  const selectedVideoModel = videoCatalog.selectedModelId;
  const setSelectedVideoModel = videoCatalog.selectModel;
  const selectedMusicModel = musicCatalog.selectedModelId;
  const setSelectedMusicModel = musicCatalog.selectModel;
  const selectedVoiceModel = voiceCatalog.selectedModelId;
  const setSelectedVoiceModel = voiceCatalog.selectModel;
  const selectedSfxModel = soundEffectsCatalog.selectedModelId;
  const setSelectedSfxModel = soundEffectsCatalog.selectModel;
  const selectedAvatarModel = digitalHumanCatalog.selectedModelId;
  const setSelectedAvatarModel = digitalHumanCatalog.selectModel;
  const selectedActionModel = actionCatalog.selectedModelId;
  const setSelectedActionModel = actionCatalog.selectModel;
  
  const [isCreationMenuOpen, setIsCreationMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false);
  const [isMusicSettingsOpen, setIsMusicSettingsOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isSfxSettingsOpen, setIsSfxSettingsOpen] = useState(false);
  
  const [creationMenuPlacement, setCreationMenuPlacement] = useState<'top' | 'bottom'>('top');
  const [modelMenuPlacement, setModelMenuPlacement] = useState<'top' | 'bottom'>('top');
  const [videoSettingsPlacement, setVideoSettingsPlacement] = useState<'top' | 'bottom'>('top');
  const [musicSettingsPlacement, setMusicSettingsPlacement] = useState<'top' | 'bottom'>('top');
  const [voiceSettingsPlacement, setVoiceSettingsPlacement] = useState<'top' | 'bottom'>('top');
  const [imageSettingsPlacement, setImageSettingsPlacement] = useState<'top' | 'bottom'>('top');
  const [sfxSettingsPlacement, setSfxSettingsPlacement] = useState<'top' | 'bottom'>('top');

  const [videoSettingsMode, setVideoSettingsMode] = useState<'all_around' | 'first_last' | 'smart_multi'>(initialSettings?.videoMode || 'all_around');
  const [videoRatio, setVideoRatio] = useState(initialSettings?.ratio || '16:9');
  const [videoResolution, setVideoResolution] = useState(initialSettings?.resolution || '720P');
  const [videoDuration, setVideoDuration] = useState(initialSettings?.duration || 4);
  const [videoAudio, setVideoAudio] = useState(true);

  const [imageRatio, setImageRatio] = useState(initialSettings?.ratio || '1:1');
  const [imageResolution, setImageResolution] = useState(initialSettings?.resolution || '2K');
  const [imageWidth, setImageWidth] = useState(1328);
  const [imageHeight, setImageHeight] = useState(1328);
  const [imageCount, setImageCount] = useState(initialSettings?.count && initialSettings.count > 0 ? initialSettings.count : 1);
  const [imageAspectRatioLocked, setImageAspectRatioLocked] = useState(true);
  const [isImageSettingsOpen, setIsImageSettingsOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const [musicSmartDuration, setMusicSmartDuration] = useState(true);
  const [musicDuration, setMusicDuration] = useState(120);
  const [sfxDuration, setSfxDuration] = useState(initialSettings?.duration && initialSettings.duration > 0 ? initialSettings.duration : 4);
  const [sfxLoop, setSfxLoop] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('zh_male_1');
  const [activeVoiceCategory, setActiveVoiceCategory] = useState('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const creationWrapperRef = useRef<HTMLDivElement>(null);
  const modelWrapperRef = useRef<HTMLDivElement>(null);
  const videoSettingsRef = useRef<HTMLDivElement>(null);
  const musicSettingsRef = useRef<HTMLDivElement>(null);
  const voiceSettingsRef = useRef<HTMLDivElement>(null);
  const sfxSettingsRef = useRef<HTMLDivElement>(null);
  const imageSettingsRef = useRef<HTMLDivElement>(null);
  
  const creationDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const videoSettingsDropdownRef = useRef<HTMLDivElement>(null);
  const musicSettingsDropdownRef = useRef<HTMLDivElement>(null);
  const voiceSettingsDropdownRef = useRef<HTMLDivElement>(null);
  const sfxSettingsDropdownRef = useRef<HTMLDivElement>(null);
  const imageSettingsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      const clickInCreationBtn = creationWrapperRef.current?.contains(target);
      const clickInCreationDropdown = creationDropdownRef.current?.contains(target);
      if (!clickInCreationBtn && !clickInCreationDropdown) {
        setIsCreationMenuOpen(false);
      }
      
      const clickInModelBtn = modelWrapperRef.current?.contains(target);
      const clickInModelDropdown = modelDropdownRef.current?.contains(target);
      if (!clickInModelBtn && !clickInModelDropdown) {
        setIsModelMenuOpen(false);
      }
      
      const clickInVideoBtn = videoSettingsRef.current?.contains(target);
      const clickInVideoDropdown = videoSettingsDropdownRef.current?.contains(target);
      if (!clickInVideoBtn && !clickInVideoDropdown) {
        setIsVideoSettingsOpen(false);
      }
      
      const clickInMusicBtn = musicSettingsRef.current?.contains(target);
      const clickInMusicDropdown = musicSettingsDropdownRef.current?.contains(target);
      if (!clickInMusicBtn && !clickInMusicDropdown) {
        setIsMusicSettingsOpen(false);
      }
      
      const clickInVoiceBtn = voiceSettingsRef.current?.contains(target);
      const clickInVoiceDropdown = voiceSettingsDropdownRef.current?.contains(target);
      if (!clickInVoiceBtn && !clickInVoiceDropdown) {
        setIsVoiceSettingsOpen(false);
      }

      const clickInSfxBtn = sfxSettingsRef.current?.contains(target);
      const clickInSfxDropdown = sfxSettingsDropdownRef.current?.contains(target);
      if (!clickInSfxBtn && !clickInSfxDropdown) {
        setIsSfxSettingsOpen(false);
      }

      const clickInImageBtn = imageSettingsRef.current?.contains(target);
      const clickInImageDropdown = imageSettingsDropdownRef.current?.contains(target);
      if (!clickInImageBtn && !clickInImageDropdown) {
        setIsImageSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [agentModelTab, setAgentModelTab] = useState<'llm' | 'image' | 'video'>('image');
  const [agentAutoMatch, setAgentAutoMatch] = useState(true);
  const [agentSelectedModels, setAgentSelectedModels] = useState<string[]>(['img_5_lite', 'img_4_7']);

  const getDropdownPlacement = (btnRef: React.RefObject<HTMLDivElement | null>, dropdownHeight: number) => {
    if (!btnRef.current) return 'top';
    const rect = btnRef.current.getBoundingClientRect();
    if (window.innerHeight - rect.bottom > dropdownHeight + 20) {
      return 'bottom';
    }
    return 'top';
  };

  const toggleCreationMenu = () => {
    if (!isCreationMenuOpen) {
      setCreationMenuPlacement(getDropdownPlacement(creationWrapperRef, 300));
    }
    setIsCreationMenuOpen(!isCreationMenuOpen);
    setIsModelMenuOpen(false);
    setIsVideoSettingsOpen(false);
    setIsMusicSettingsOpen(false);
    setIsVoiceSettingsOpen(false);
  };

  const toggleModelMenu = () => {
    if (!isModelMenuOpen) {
      setModelMenuPlacement(getDropdownPlacement(modelWrapperRef, 350));
    }
    setIsModelMenuOpen(!isModelMenuOpen);
    setIsCreationMenuOpen(false);
    setIsVideoSettingsOpen(false);
    setIsMusicSettingsOpen(false);
    setIsVoiceSettingsOpen(false);
  };
  
  const toggleVideoSettings = () => {
    if (!isVideoSettingsOpen) {
      setVideoSettingsPlacement(getDropdownPlacement(videoSettingsRef, 400));
    }
    setIsVideoSettingsOpen(!isVideoSettingsOpen);
    setIsCreationMenuOpen(false);
    setIsModelMenuOpen(false);
    setIsMusicSettingsOpen(false);
    setIsVoiceSettingsOpen(false);
  };
  
  const toggleMusicSettings = () => {
    if (!isMusicSettingsOpen) {
      setMusicSettingsPlacement(getDropdownPlacement(musicSettingsRef, 150));
    }
    setIsMusicSettingsOpen(!isMusicSettingsOpen);
    setIsCreationMenuOpen(false);
    setIsModelMenuOpen(false);
    setIsVideoSettingsOpen(false);
    setIsVoiceSettingsOpen(false);
  };
  
  const toggleVoiceSettings = () => {
    if (!isVoiceSettingsOpen) {
      setVoiceSettingsPlacement(getDropdownPlacement(voiceSettingsRef, 250));
    }
    setIsVoiceSettingsOpen(!isVoiceSettingsOpen);
    setIsCreationMenuOpen(false);
    setIsModelMenuOpen(false);
    setIsVideoSettingsOpen(false);
    setIsMusicSettingsOpen(false);
  };

  const toggleImageSettings = () => {
    if (!isImageSettingsOpen) {
      setImageSettingsPlacement(getDropdownPlacement(imageSettingsRef, 400));
    }
    setIsImageSettingsOpen(!isImageSettingsOpen);
    setIsCreationMenuOpen(false);
    setIsModelMenuOpen(false);
    setIsVideoSettingsOpen(false);
    setIsMusicSettingsOpen(false);
    setIsVoiceSettingsOpen(false);
  };

  const toggleSfxSettings = () => {
    if (!isSfxSettingsOpen) {
      setSfxSettingsPlacement(getDropdownPlacement(sfxSettingsRef, 200));
    }
    setIsSfxSettingsOpen(!isSfxSettingsOpen);
    setIsCreationMenuOpen(false);
    setIsModelMenuOpen(false);
    setIsVideoSettingsOpen(false);
    setIsMusicSettingsOpen(false);
    setIsVoiceSettingsOpen(false);
    setIsImageSettingsOpen(false);
  };

  const isVideo = creationType === 'video';
  const isImage = creationType === 'image';
  const isAgent = creationType === 'agent';
  const isMusic = creationType === 'music';
  const isVoice = creationType === 'voice';
  const isSfx = creationType === 'sfx';
  const isDigitalHuman = creationType === 'digital_human';
  const isAction = creationType === 'action';

  // Agent mode: the orchestration (LLM) model is configured next to the media
  // models the agent may call. The selection persists per account and rides
  // the agent command as `parameters.agentModel`.
  const { models: agentLlmModels, loading: agentLlmModelsLoading } = useAgentLlmModels(isAgent);
  const [agentLlmModelId, setAgentLlmModelIdState] = useState<string | undefined>(() => {
    const stored = readAccountScopedItem(AGENT_LLM_MODEL_KEY)?.trim();
    return stored ? stored : undefined;
  });
  const setAgentLlmModelId = (modelId: string) => {
    if (!modelId.trim()) return;
    setAgentLlmModelIdState(modelId);
    writeAccountScopedItem(AGENT_LLM_MODEL_KEY, modelId);
  };
  useEffect(() => {
    if (!isAgent || agentLlmModels.length === 0) return;
    // Keep a stored selection only while the catalog still publishes it.
    if (agentLlmModelId !== undefined && agentLlmModels.some((model) => model.id === agentLlmModelId)) {
      return;
    }
    const fallback = agentLlmModels.find((model) => model.id === PREFERRED_AGENT_LLM_MODEL_ID)
      ?? agentLlmModels[0];
    setAgentLlmModelIdState(fallback.id);
    writeAccountScopedItem(AGENT_LLM_MODEL_KEY, fallback.id);
  }, [isAgent, agentLlmModelId, agentLlmModels]);

  const selectedModelId = isSfx ? selectedSfxModel : isDigitalHuman ? selectedAvatarModel : isAction ? selectedActionModel : isVoice ? selectedVoiceModel : isMusic ? selectedMusicModel : isVideo ? selectedVideoModel : selectedImageModel;

  // Per-model parameter support. The picker renders only the knobs the selected
  // model's vendor surface accepts, and the submit carries only those values.
  const currentCatalog = isSfx ? soundEffectsCatalog
    : isDigitalHuman ? digitalHumanCatalog
      : isAction ? actionCatalog
        : isVoice ? voiceCatalog
          : isMusic ? musicCatalog
            : isVideo ? videoCatalog : imageCatalog;
  const currentParameters = currentCatalog.getDefinition(selectedModelId)?.parameters;
  const videoParameters = currentParameters?.video;
  const imageParameters = currentParameters?.image;
  const musicParameters = currentParameters?.music;
  const voiceParameters = currentParameters?.voice;
  const sfxParameters = currentParameters?.sound_effects;
  const videoSettingsModeOptions = useMemo(
    () => supportedVideoSettingsModes(videoParameters),
    [videoParameters],
  );
  const videoAspectRatioOptions = useMemo(
    () => supportedVideoAspectRatios(videoParameters),
    [videoParameters],
  );
  const videoResolutionOptions = useMemo(
    () => supportedVideoResolutions(videoParameters),
    [videoParameters],
  );
  const imageAspectRatioOptions = useMemo(
    () => supportedImageAspectRatios(imageParameters),
    [imageParameters],
  );
  const imageResolutionOptions = imageParameters?.resolutions;
  const voiceOptions = voiceParameters?.voices;
  const videoGenerationMode = useMemo(
    () => (isVideo
      ? resolveVideoGenerationMode(
        videoSettingsMode as CreativeVideoSettingsMode,
        uploadedImages.length > 0,
        videoParameters,
      )
      : undefined),
    [isVideo, videoSettingsMode, uploadedImages.length, videoParameters],
  );

  // Clamp pending selections whenever the selected model changes: a resolution
  // or duration the new model does not accept must never reach the wire.
  useEffect(() => {
    if (videoAspectRatioOptions && videoAspectRatioOptions.length > 0
      && !videoAspectRatioOptions.includes(videoRatio)) {
      setVideoRatio(videoAspectRatioOptions[0]);
    }
    if (videoResolutionOptions && videoResolutionOptions.length > 0
      && !videoResolutionOptions.includes(videoResolution.toUpperCase())) {
      setVideoResolution(videoResolutionOptions[0]);
    }
    if (videoParameters?.duration) {
      const next = clampDurationSeconds(videoDuration, videoParameters.duration);
      if (next !== videoDuration) setVideoDuration(next);
    }
    if (videoSettingsModeOptions && videoSettingsModeOptions.length > 0
      && !videoSettingsModeOptions.includes(videoSettingsMode as CreativeVideoSettingsMode)) {
      setVideoSettingsMode(videoSettingsModeOptions[0]);
    }
  }, [
    videoAspectRatioOptions,
    videoResolutionOptions,
    videoParameters,
    videoSettingsModeOptions,
    videoRatio,
    videoResolution,
    videoDuration,
    videoSettingsMode,
  ]);

  // Audio starts at the selected model's capability; switching models resets
  // the toggle, and a model without synchronized audio can never submit it.
  useEffect(() => {
    if (lastAudioModelRef.current === selectedModelId) return;
    lastAudioModelRef.current = selectedModelId;
    setVideoAudio(videoParameters?.outputAudio ?? false);
  }, [selectedModelId, videoParameters]);

  useEffect(() => {
    if (videoParameters !== undefined && !videoParameters.outputAudio && videoAudio) {
      setVideoAudio(false);
    }
  }, [videoParameters, videoAudio]);

  useEffect(() => {
    if (imageAspectRatioOptions && imageAspectRatioOptions.length > 0
      && !imageAspectRatioOptions.includes(imageRatio)) {
      const next = imageAspectRatioOptions[0] ?? '1:1';
      setImageRatio(next);
      const dimensions = imageDimensionsFor(next, imageResolution);
      setImageWidth(dimensions.w);
      setImageHeight(dimensions.h);
    }
    if (imageResolutionOptions && imageResolutionOptions.length > 0
      && !imageResolutionOptions.includes(imageResolution)) {
      const next = imageResolutionOptions[0] ?? '1K';
      setImageResolution(next);
      const dimensions = imageDimensionsFor(imageRatio, next);
      setImageWidth(dimensions.w);
      setImageHeight(dimensions.h);
    }
  }, [imageAspectRatioOptions, imageResolutionOptions, imageRatio, imageResolution]);

  useEffect(() => {
    if (!musicParameters?.duration) return;
    const next = clampDurationSeconds(musicDuration, musicParameters.duration);
    if (next !== musicDuration) setMusicDuration(next);
  }, [musicParameters, musicDuration]);

  useEffect(() => {
    const maxCount = imageParameters?.maxCount ?? 1;
    if (imageCount > maxCount) setImageCount(maxCount);
    if (imageCount < 1) setImageCount(1);
  }, [imageParameters, imageCount]);

  useEffect(() => {
    if (!sfxParameters?.duration) return;
    const next = clampDurationSeconds(sfxDuration, sfxParameters.duration);
    if (next !== sfxDuration) setSfxDuration(next);
  }, [sfxParameters, sfxDuration]);

  useEffect(() => {
    const options = voiceOptions;
    if (!options || options.length === 0) return;
    if (!options.some((option) => option.id === selectedVoice)) {
      setSelectedVoice(options[0].id);
    }
  }, [voiceOptions, selectedVoice]);

  const onSettingsChangeRef = useRef(onSettingsChange);
  useEffect(() => {
    onSettingsChangeRef.current = onSettingsChange;
  }, [onSettingsChange]);

  const lastSettingsRef = useRef<string>('');
  /** Model whose audio capability last initialized the toggle. */
  const lastAudioModelRef = useRef<string | undefined>(undefined);

  // Real-time synchronization of state settings with the parent component
  useEffect(() => {
    const nextSettings = {
      model: selectedModelId,
      ratio: isVideo ? videoRatio : (isImage ? imageRatio : '1:1'),
      resolution: isVideo ? videoResolution : (isImage ? imageResolution : undefined),
      imageWidth: isImage ? imageWidth : undefined,
      imageHeight: isImage ? imageHeight : undefined,
      duration: isVideo
        ? videoDuration
        : (isMusic
          ? (musicSmartDuration ? undefined : musicDuration)
          : (isSfx ? sfxDuration : undefined)),
      videoMode: isVideo ? videoSettingsMode : undefined,
      generationMode: isVideo ? videoGenerationMode : undefined,
      audio: isVideo ? videoAudio : undefined,
      voiceId: isVoice ? selectedVoice : undefined,
      count: isImage ? imageCount : undefined,
      loop: isSfx ? sfxLoop : undefined,
    };

    const nextSettingsStr = JSON.stringify(nextSettings);
    if (lastSettingsRef.current !== nextSettingsStr) {
      lastSettingsRef.current = nextSettingsStr;
      if (onSettingsChangeRef.current) {
        onSettingsChangeRef.current(nextSettings);
      }
    }
  }, [
    selectedModelId,
    videoRatio,
    videoResolution,
    videoDuration,
    musicDuration,
    musicSmartDuration,
    sfxDuration,
    sfxLoop,
    videoSettingsMode,
    videoGenerationMode,
    videoAudio,
    selectedVoice,
    imageRatio,
    imageResolution,
    imageWidth,
    imageHeight,
    imageCount,
    isVideo,
    isImage,
    isMusic,
    isVoice,
    isSfx,
    isDigitalHuman,
    isAction
  ]);

  // Sync value changes from parent if any
  useEffect(() => {
    if (defaultValue !== undefined) {
      setInput(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    if (initialMode !== undefined) {
      setCreationType(initialMode);
    }
  }, [initialMode]);

  return {
    input, setInput,
    creationType, setCreationType,
    // Unified model catalog lists (static baseline + remote sync layer)
    imageModels: imageCatalog.models,
    videoModels: videoCatalog.models,
    musicModels: musicCatalog.models,
    voiceModels: voiceCatalog.models,
    soundEffectsModels: soundEffectsCatalog.models,
    avatarModels: digitalHumanCatalog.models,
    actionModels: actionCatalog.models,
    selectedImageModel, setSelectedImageModel,
    selectedVideoModel, setSelectedVideoModel,
    selectedMusicModel, setSelectedMusicModel,
    selectedVoiceModel, setSelectedVoiceModel,
    selectedSfxModel, setSelectedSfxModel,
    selectedAvatarModel, setSelectedAvatarModel,
    selectedActionModel, setSelectedActionModel,
    isCreationMenuOpen, setIsCreationMenuOpen,
    isModelMenuOpen, setIsModelMenuOpen,
    isVideoSettingsOpen, setIsVideoSettingsOpen,
    isMusicSettingsOpen, setIsMusicSettingsOpen,
    isVoiceSettingsOpen, setIsVoiceSettingsOpen,
    isSfxSettingsOpen, setIsSfxSettingsOpen,
    isImageSettingsOpen, setIsImageSettingsOpen,
    creationMenuPlacement,
    modelMenuPlacement,
    videoSettingsPlacement,
    musicSettingsPlacement,
    voiceSettingsPlacement,
    sfxSettingsPlacement,
    imageSettingsPlacement,
    videoSettingsMode, setVideoSettingsMode,
    videoRatio, setVideoRatio,
    videoResolution, setVideoResolution,
    videoDuration, setVideoDuration,
    // Per-model parameter support (undefined for unprofiled remote entries)
    videoSettingsModeOptions,
    videoAspectRatioOptions,
    videoResolutionOptions,
    videoGenerationMode,
    videoOutputAudio: videoParameters?.outputAudio,
    videoDurationRange: videoParameters?.duration ?? null,
    videoAudio, setVideoAudio,
    imageAspectRatioOptions,
    imageResolutionOptions,
    imageMaxCount: imageParameters?.maxCount ?? 1,
    imageCustomSize: imageParameters?.customSize,
    musicDurationRange: musicParameters?.duration ?? null,
    musicSmartDurationAllowed: musicParameters?.smartDuration ?? false,
    voiceOptions,
    imageRatio, setImageRatio,
    imageResolution, setImageResolution,
    imageWidth, setImageWidth,
    imageHeight, setImageHeight,
    imageCount, setImageCount,
    imageAspectRatioLocked, setImageAspectRatioLocked,
    musicSmartDuration, setMusicSmartDuration,
    musicDuration, setMusicDuration,
    sfxDuration, setSfxDuration,
    sfxLoop, setSfxLoop,
    sfxDurationRange: sfxParameters?.duration ?? null,
    sfxSupportsLoop: sfxParameters?.supportsLoop ?? false,
    selectedVoice, setSelectedVoice,
    activeVoiceCategory, setActiveVoiceCategory,
    playingVoiceId, setPlayingVoiceId,
    agentModelTab, setAgentModelTab,
    agentAutoMatch, setAgentAutoMatch,
    agentSelectedModels, setAgentSelectedModels,
    agentLlmModels, agentLlmModelsLoading,
    agentLlmModelId, setAgentLlmModelId,
    textareaRef,
    creationWrapperRef,
    modelWrapperRef,
    videoSettingsRef,
    musicSettingsRef,
    voiceSettingsRef,
    sfxSettingsRef,
    imageSettingsRef,
    creationDropdownRef,
    modelDropdownRef,
    videoSettingsDropdownRef,
    musicSettingsDropdownRef,
    voiceSettingsDropdownRef,
    sfxSettingsDropdownRef,
    imageSettingsDropdownRef,
    toggleCreationMenu,
    toggleModelMenu,
    toggleVideoSettings,
    toggleMusicSettings,
    toggleVoiceSettings,
    toggleSfxSettings,
    toggleImageSettings,
    uploadedImages, setUploadedImages,
    isVideo, isImage, isAgent, isMusic, isVoice, isSfx, isDigitalHuman, isAction,
    selectedModelId
  };
}
