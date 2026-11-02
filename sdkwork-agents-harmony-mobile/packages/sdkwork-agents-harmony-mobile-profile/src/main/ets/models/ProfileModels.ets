/**
 * View models for the profile capability.
 *
 * API DTOs come from generated ArkTS/TypeScript SDKs; this file owns view models
 * only.
 */
export interface ProfileSummary {
  readonly authenticated: boolean;
  readonly tenantId: string;
}

/** One profile-hub link row. */
export interface ProfileLink {
  readonly routeId: string;
  readonly labelKey: string;
}

export interface AgentsSettings {
  /** Composer sends on Enter instead of inserting a newline. */
  readonly enterToSend: boolean;
  /** Message list follows the newest message. */
  readonly autoScroll: boolean;
  /** Asset grid density (`comfortable` two-column, `compact` three-column). */
  readonly gridDensity: string;
}
