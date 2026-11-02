import {
  unavailableAgentsPageSnapshot,
  type AgentsPageSnapshot,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';

import {
  type CreativeAspectOption,
  type CreativeModalityOption,
  type CreativeResultItem,
  type CreativeSessionSummary,
  type CreativeSubmitResult,
} from '../models/CreativeModels';

/**
 * Creative studio use cases.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 4 and
 * `docs/engineering/plans/PLAN-2026-1102-client-page-parity.md` section 6.
 *
 * Generations are served by the agents generations service (PC composes
 * `@sdkwork/agents-pc-core/sdk/generationsService`). The Harmony root has no
 * adapted ArkTS generations transport yet, so submit and session reads report
 * `unavailable` instead of fabricating queued records or empty history.
 *
 * Modality and aspect catalogues are presentation constants owned here; they are
 * not remote data and are therefore not subject to the transport gap.
 */
export class CreativeService {
  modalities(): CreativeModalityOption[] {
    return [
      { id: 'image', labelKey: 'agents.creative.modality.image' },
      { id: 'video', labelKey: 'agents.creative.modality.video' },
      { id: 'music', labelKey: 'agents.creative.modality.music' },
      { id: 'voice', labelKey: 'agents.creative.modality.voice' },
    ];
  }

  aspects(): CreativeAspectOption[] {
    return [
      { id: 'square', labelKey: 'agents.creative.aspect.square', ratio: '1:1' },
      { id: 'portrait', labelKey: 'agents.creative.aspect.portrait', ratio: '3:4' },
      { id: 'landscape', labelKey: 'agents.creative.aspect.landscape', ratio: '4:3' },
      { id: 'wide', labelKey: 'agents.creative.aspect.wide', ratio: '16:9' },
    ];
  }

  async loadSessions(): Promise<AgentsPageSnapshot<CreativeSessionSummary>> {
    return unavailableAgentsPageSnapshot<CreativeSessionSummary>('agents.creative.unavailable');
  }

  async loadResults(sessionId: string): Promise<AgentsPageSnapshot<CreativeResultItem>> {
    if (sessionId.trim().length === 0) {
      return unavailableAgentsPageSnapshot<CreativeResultItem>('agents.creative.unavailable');
    }
    return unavailableAgentsPageSnapshot<CreativeResultItem>('agents.creative.unavailable');
  }

  /**
   * Validates locally first, then reports the transport gap.
   *
   * Local validation is real: an empty prompt or an unknown modality/aspect must
   * never reach a submit call, and the page surfaces the validation copy.
   */
  async submit(
    prompt: string,
    modalityId: string,
    aspectId: string,
  ): Promise<CreativeSubmitResult> {
    if (prompt.trim().length === 0) {
      return { state: 'invalid', messageKey: 'agents.creative.validation.promptRequired' };
    }
    if (!this.hasModality(modalityId)) {
      return { state: 'invalid', messageKey: 'agents.creative.validation.modalityUnknown' };
    }
    if (!this.hasAspect(aspectId)) {
      return { state: 'invalid', messageKey: 'agents.creative.validation.aspectUnknown' };
    }
    return { state: 'unavailable', messageKey: 'agents.creative.unavailable' };
  }

  private hasModality(modalityId: string): boolean {
    return this.modalities().some(
      (option: CreativeModalityOption) => option.id === modalityId,
    );
  }

  private hasAspect(aspectId: string): boolean {
    return this.aspects().some(
      (option: CreativeAspectOption) => option.id === aspectId,
    );
  }
}
