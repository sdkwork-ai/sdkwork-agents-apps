/**
 * Shared page load-state contract.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 5 — every screen handles
 * loading, empty, permission-denied, offline/unavailable, and unknown-error
 * states.
 *
 * `unavailable` is deliberately distinct from `empty`: `empty` means the
 * transport answered with no rows, `unavailable` means this client root has no
 * adapted SDK transport for the capability yet. Collapsing the two is what
 * produces fabricated "no data" screens
 * (`docs/engineering/plans/PLAN-2026-1102-client-page-parity.md` section 6).
 */

export type AgentsPageState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'unavailable'
  | 'unauthenticated'
  | 'error';

export interface AgentsPageSnapshot<T> {
  readonly state: AgentsPageState;
  readonly items: T[];
  readonly nextCursor?: string;
  /** Stable message key for the owning package's i18n fragment. */
  readonly messageKey?: string;
}

export function idleAgentsPageSnapshot<T>(): AgentsPageSnapshot<T> {
  return { state: 'idle', items: [] };
}

export function loadingAgentsPageSnapshot<T>(): AgentsPageSnapshot<T> {
  return { state: 'loading', items: [] };
}

export function readyAgentsPageSnapshot<T>(items: T[], nextCursor?: string): AgentsPageSnapshot<T> {
  return {
    state: items.length === 0 ? 'empty' : 'ready',
    items,
    nextCursor,
  };
}

export function unavailableAgentsPageSnapshot<T>(messageKey: string): AgentsPageSnapshot<T> {
  return { state: 'unavailable', items: [], messageKey };
}

export function unauthenticatedAgentsPageSnapshot<T>(messageKey: string): AgentsPageSnapshot<T> {
  return { state: 'unauthenticated', items: [], messageKey };
}

export function failedAgentsPageSnapshot<T>(messageKey: string): AgentsPageSnapshot<T> {
  return { state: 'error', items: [], messageKey };
}

/** True when a state should render a retry affordance. */
export function isAgentsPageRetryable(state: AgentsPageState): boolean {
  return state === 'unavailable' || state === 'error' || state === 'unauthenticated';
}
