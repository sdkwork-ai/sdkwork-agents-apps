/**
 * View models for the creative capability.
 *
 * API DTOs come from generated ArkTS/TypeScript SDKs; this file owns view models
 * only.
 */
export interface CreativeModalityOption {
  readonly id: string;
  readonly labelKey: string;
}

export interface CreativeAspectOption {
  readonly id: string;
  readonly labelKey: string;
  readonly ratio: string;
}

export interface CreativeSessionSummary {
  readonly id: string;
  readonly title: string;
  readonly updatedAt: string;
}

export interface CreativeResultItem {
  readonly id: string;
  readonly mediaUrl: string;
  readonly kind: string;
}

/** Outcome of a generation submit attempt. */
export type CreativeSubmitState = 'submitted' | 'invalid' | 'unavailable' | 'error';

export interface CreativeSubmitResult {
  readonly state: CreativeSubmitState;
  readonly messageKey: string;
}
