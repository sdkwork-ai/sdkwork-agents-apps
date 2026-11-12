import { useEffect, useRef, useState } from 'react';

import { agentsGenerationsService } from '@sdkwork/agents-pc-core/sdk/generationsService';
import type {
  CreativeGenerationModality,
} from '@sdkwork/agents-pc-core/sdk/creationTypes';
import type { GenerationPricingEstimate } from '@sdkwork/agents-pc-core/sdk/generationsAppSdkClient';

import {
  creativeModelCatalogService,
  resolveCreativeDispatch,
  wireAspectRatio,
} from '../creative-model-catalog';
import type { CreativeInputSettings } from './useCreativeInputBox';

export interface CreativeCreditEstimateInput {
  /** Creation-type id (`image`, `video`, ...). `agent` disables estimation. */
  mode: string | null;
  /** Selected model id for the active modality. */
  modelId?: string;
  settings: CreativeInputSettings;
  /** Prompt text; only its character length is priced (voice/speech). */
  prompt?: string;
  /** Reference uploads upgrade the image/video operation, like the submit does. */
  hasReferenceImages?: boolean;
  /** Precise catalog generation mode the submit will carry. */
  generationMode?: string;
  /** Smart duration keeps the music length model-decided: no declared quantity. */
  musicSmartDuration?: boolean;
}

export interface CreativeCreditEstimateState {
  /** `idle` for agent mode, `loading` while the request is in flight,
   * `ready` when a priced estimate is shown, `unavailable` otherwise. */
  status: 'idle' | 'loading' | 'ready' | 'unavailable';
  /** Submit-button label, e.g. `36`, `≥ 1` (single-unit lower bound) or `—`. */
  pointsLabel: string;
  /** Tooltip detail: per-meter breakdown, or the unpriced diagnosis. */
  detail: string;
  estimate: GenerationPricingEstimate | null;
}

/** Format a points total for the submit button: at most one fractional digit. */
function formatPointsLabel(pointsTotal: string): string {
  const points = Number(pointsTotal);
  if (!Number.isFinite(points)) {
    return '—';
  }
  const rounded = Math.round(points * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const METER_UNIT_LABELS: Record<string, string> = {
  second: '秒',
  minute: '分钟',
  character: '字符',
  item: '个',
  megapixel: '百万像素',
  pixel: '像素',
};

/**
 * Real-time credit estimate for the creative composer.
 *
 * Replaces the hardcoded per-modality constants ("36", "3/张", ...) with the
 * backend's projection of the actual wallet debit: the estimate endpoint
 * prices the command with the same rate book the billing pipeline charges
 * with, so switching model, resolution, duration or count re-prices live.
 * An unpriced command (model without a rate, per-token metering) shows `—`
 * with the diagnosis instead of a fabricated number.
 */
export function useCreativeCreditEstimate(
  input: CreativeCreditEstimateInput,
): CreativeCreditEstimateState {
  const [state, setState] = useState<CreativeCreditEstimateState>({
    status: 'idle',
    pointsLabel: '—',
    detail: '',
    estimate: null,
  });

  const requestSequence = useRef(0);
  const {
    mode,
    modelId,
    settings,
    prompt,
    hasReferenceImages,
    generationMode,
    musicSmartDuration,
  } = input;

  useEffect(() => {
    const dispatch = resolveCreativeDispatch(mode, { hasReferenceImages, generationMode });
    if (!dispatch) {
      requestSequence.current += 1;
      setState({ status: 'idle', pointsLabel: '—', detail: '', estimate: null });
      return;
    }
    const modality: CreativeGenerationModality = dispatch.modality;
    const resolvedModel = modelId
      ? creativeModelCatalogService.resolveSelection(modality, modelId)
      : undefined;
    const vendorCode = resolvedModel
      ? creativeModelCatalogService.getDefinition(modality, resolvedModel)?.vendorCode
      : undefined;
    const durationSeconds = musicSmartDuration && modality === 'music'
      ? undefined
      : settings.duration;
    const generationConfig = Object.fromEntries(
      Object.entries({
        // `智能` lets the model choose, so it is not a wire aspect ratio.
        aspectRatio: wireAspectRatio(settings.ratio),
        resolution: settings.resolution,
        durationSeconds,
        imageCount: settings.count,
        audio: settings.audio,
        loop: settings.loop,
        size: settings.imageWidth && settings.imageHeight
          ? `${settings.imageWidth}x${settings.imageHeight}`
          : undefined,
      }).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
    const parameters = {
      ...(vendorCode ? { vendor: vendorCode } : {}),
      // Precise mode: the pricing catalog selects the video tier from the
      // generation mode's profile, not from the routed operation alone.
      ...(generationMode ? { generationMode } : {}),
      ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
    };

    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;
    // Keep the previous label visible (dimmed by the consumer) while a new
    // estimate loads, so model/parameter switches do not flicker.
    setState((previous) => ({
      ...previous,
      status: 'loading',
      pointsLabel: previous.status === 'ready' ? previous.pointsLabel : '…',
    }));

    const timer = setTimeout(() => {
      agentsGenerationsService
        .estimateCredits({
          modality,
          operationType: dispatch.operationType,
          ...(resolvedModel ? { model: resolvedModel } : {}),
          ...(Object.keys(parameters).length > 0 ? { parameters } : {}),
          ...(prompt?.trim() ? { prompt: prompt.trim() } : {}),
        })
        .then((estimate) => {
          if (requestSequence.current !== sequence) return;
          if (!estimate.priced) {
            setState({
              status: 'unavailable',
              pointsLabel: '—',
              detail: estimate.unpricedReason ?? '该命令暂无可用的积分报价',
              estimate,
            });
            return;
          }
          const singleUnit = estimate.lines.some((line) => line.quantityBasis === 'single_unit');
          const breakdown = estimate.lines
            .map((line) => {
              const unitLabel = METER_UNIT_LABELS[line.quantityUnit] ?? line.quantityUnit;
              const tierSuffix = line.tierCode ? ` (${line.tierCode})` : '';
              return `${line.meterCode} ×${line.quantity} ${unitLabel}${tierSuffix} = ${line.points} 积分`;
            })
            .join('\n');
          setState({
            status: 'ready',
            pointsLabel: singleUnit ? `≥ ${formatPointsLabel(estimate.pointsTotal)}` : formatPointsLabel(estimate.pointsTotal),
            detail: breakdown || `本次预计消耗 ${estimate.pointsTotal} 积分，实际以结算为准`,
            estimate,
          });
        })
        .catch((error) => {
          if (requestSequence.current !== sequence) return;
          console.error('Creative credit estimate failed.', error);
          setState({
            status: 'unavailable',
            pointsLabel: '—',
            detail: '积分估算服务暂不可用',
            estimate: null,
          });
        });
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [
    mode,
    hasReferenceImages,
    generationMode,
    modelId,
    settings.ratio,
    settings.resolution,
    settings.duration,
    settings.count,
    settings.audio,
    settings.loop,
    settings.imageWidth,
    settings.imageHeight,
    prompt,
    musicSmartDuration,
  ]);

  return state;
}
