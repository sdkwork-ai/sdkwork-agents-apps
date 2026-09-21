/**
 * Funding entry point for the H5 conversation surface.
 *
 * Mirrors `@sdkwork/agents-pc-chat/services/chatBalancePort` on the mobile
 * surface. The conversation package `MUST NOT` import generated SDK clients
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 1 and 8), so the funding
 * navigation is injected by the composition root through
 * `configureConversationBilling`.
 *
 * When no handler is configured the call degrades to a window event, which lets
 * a hosting shell (mini-program webview, embedded page) intercept it. If neither
 * exists the request is a no-op — the failure card still renders its message, it
 * simply has no actionable button, which is preferable to navigating nowhere.
 */

/** Window event emitted when no explicit funding handler is configured. */
export const AGENTS_OPEN_TOKEN_PLAN_EVENT = 'agents:open-token-plan';

let openTokenPlan: (() => void) | null = null;

export function configureConversationBilling(handler: (() => void) | null): void {
  openTokenPlan = handler;
}

/**
 * Asks the host to open the Token Plan / recharge surface.
 *
 * Returns `true` when a handler or event consumer could plausibly act on it, so
 * callers can decide whether to render an actionable button.
 */
export function requestAgentsTokenPlan(): boolean {
  if (openTokenPlan) {
    openTokenPlan();
    return true;
  }
  window.dispatchEvent(new CustomEvent(AGENTS_OPEN_TOKEN_PLAN_EVENT));
  return true;
}

/** Whether a funding entry point is wired (used to decide button rendering). */
export function hasConversationBilling(): boolean {
  return openTokenPlan !== null;
}
