/**
 * Classification of conversation turn failures that the UI must present
 * differently.
 *
 * Mirrors `@sdkwork/agents-pc-chat/utils/chatFailure` on the H5 surface. The two
 * apps cannot share a module (`agents-h5-*` and `agents-pc-*` are independent
 * workspace roots), so the rules are duplicated deliberately and must be kept in
 * sync: a wallet shortfall is reported as HTTP 402 / code `40201` /
 * `failedStage: billing_precharge`, and it is the only common failure the user
 * can fix themselves, so it gets a funding action instead of a retry hint.
 *
 * Detection is layered so it survives a mixed deployment (new gateway + old
 * gateway): explicit `action.kind`, then the 402 contract, then the pre-402
 * `50201 dispatch_failed` shape. Message text is only a last-resort signal for
 * the legacy shape because it is localized server-side.
 */

export type ConversationFailureKind = 'insufficient_balance' | 'generic';

export interface ConversationFailureLike {
  message?: string;
  i18nKey?: string;
  code?: number | string;
  httpStatus?: number;
  failedStage?: string;
  action?: { kind?: string; href?: string; label?: string };
}

/** Numeric code for `INSUFFICIENT_BALANCE` (API_SPEC §15.3). */
export const INSUFFICIENT_BALANCE_CODE = 40201;

const FUNDING_ACTION_KINDS = new Set(['recharge', 'topup', 'top_up', 'membership', 'purchase']);
const PRECHARGE_STAGE = 'billing_precharge';

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

export function classifyConversationFailure(
  failure: ConversationFailureLike,
): ConversationFailureKind {
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
  if (failure.httpStatus === 402) {
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

export function isInsufficientBalanceFailure(failure: ConversationFailureLike): boolean {
  return classifyConversationFailure(failure) === 'insufficient_balance';
}
