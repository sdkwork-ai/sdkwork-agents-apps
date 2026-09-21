/**
 * Classification of chat turn failures that the UI must present differently.
 *
 * The cloud router reports a wallet shortfall as HTTP 402 with code `40201`
 * (`INSUFFICIENT_BALANCE`) and `failedStage: billing_precharge`. That problem is
 * the only common failure the user can fix themselves, so it must not be shown
 * as a generic "generation failed" message: the UI has to offer a funding
 * entry point.
 *
 * Detection is intentionally layered so it keeps working while older gateway
 * builds (which still stamp the shortfall as `50201`/`dispatch_failed`) are
 * deployed alongside the new one:
 *   1. a machine `action.kind` from the problem (newest, most explicit);
 *   2. HTTP 402 / code `40201` (new contract);
 *   3. the pre-402 shape: `50201` + `dispatch_failed`, which the pre-fix
 *      gateway produced for a rejected precharge hold.
 * The message text is never used as the primary signal — only as a last-resort
 * heuristic for the legacy shape, because the string is localized server-side.
 */

/** Failure sub-shapes the chat surface renders with distinct affordances. */
export type ChatFailureKind = 'insufficient_balance' | 'generic';

export interface ChatFailureLike {
  message?: string;
  i18nKey?: string;
  code?: number | string;
  httpStatus?: number;
  failedStage?: string;
  action?: { kind?: string; href?: string; label?: string };
}

/** Numeric code for `INSUFFICIENT_BALANCE` (see API_SPEC §15.3 registry). */
export const INSUFFICIENT_BALANCE_CODE = 40201;
/** HTTP status accompanying `INSUFFICIENT_BALANCE`. */
export const INSUFFICIENT_BALANCE_HTTP_STATUS = 402;

/** Machine `action.kind` values the backend may attach to a funding problem. */
const FUNDING_ACTION_KINDS = new Set(['recharge', 'topup', 'top_up', 'membership', 'purchase']);

/** `failedStage` the gateway stamps on a rejected precharge hold. */
const PRECHARGE_STAGE = 'billing_precharge';

/**
 * Phrases that identify a wallet shortfall in responses produced before the
 * dedicated 402 contract existed. Kept deliberately narrow: these strings come
 * from the account repository / gateway and are not localized there, so they are
 * stable across locales.
 */
const LEGACY_BALANCE_MARKERS = [
  'insufficient available balance',
  'insufficient spendable points',
  'insufficient account balance',
  'insufficient balance',
];

function readCode(value: number | string | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function messageLooksLikeBalanceShortfall(message: string | undefined): boolean {
  if (!message) {
    return false;
  }
  const lower = message.toLowerCase();
  return LEGACY_BALANCE_MARKERS.some((marker) => lower.includes(marker));
}

/**
 * Resolves how the chat surface should present a failed turn.
 *
 * Note the third branch: a legacy gateway reported the shortfall as
 * `50201 dispatch_failed`, so an HTTP 502 alone is *not* enough — the stage and
 * the message must both point at the precharge hold before the failure is
 * treated as a funding problem. Without that guard every genuine upstream
 * outage would render a "recharge" button.
 */
export function classifyChatFailure(failure: ChatFailureLike): ChatFailureKind {
  const actionKind = failure.action?.kind?.trim().toLowerCase();
  if (actionKind && FUNDING_ACTION_KINDS.has(actionKind)) {
    return 'insufficient_balance';
  }

  const code = readCode(failure.code);
  if (code === INSUFFICIENT_BALANCE_CODE) {
    return 'insufficient_balance';
  }
  // HTTP 402 is the authoritative signal and outranks any accompanying body
  // code: the gateway may echo an older `50201` in the same payload, but 402
  // is only ever emitted for a funding shortfall.
  if (failure.httpStatus === INSUFFICIENT_BALANCE_HTTP_STATUS) {
    return 'insufficient_balance';
  }
  if (failure.failedStage?.trim().toLowerCase() === PRECHARGE_STAGE) {
    return 'insufficient_balance';
  }

  if (messageLooksLikeBalanceShortfall(failure.message)) {
    return 'insufficient_balance';
  }

  return 'generic';
}

/** Convenience predicate for the funding shortfall case. */
export function isInsufficientBalanceFailure(failure: ChatFailureLike): boolean {
  return classifyChatFailure(failure) === 'insufficient_balance';
}
