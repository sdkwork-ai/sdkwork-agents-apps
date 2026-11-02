/**
 * View models for the inspiration capability.
 *
 * API DTOs come from generated ArkTS/TypeScript SDKs; this file owns view models
 * only.
 */
export interface InspirationCard {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly prompt: string;
  readonly coverUrl: string;
}
