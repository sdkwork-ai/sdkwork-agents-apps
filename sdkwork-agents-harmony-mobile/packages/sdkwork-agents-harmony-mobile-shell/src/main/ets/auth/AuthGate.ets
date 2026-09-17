/**
 * AuthGate integration.
 *
 * Route guards are shell/runtime responsibilities. Capability packages declare
 * auth mode and permission hints only.
 */
export interface AgentsHarmonyAuthGateDecision {
  readonly allowed: boolean;
  readonly reason?: string;
}

export function evaluateAgentsHarmonyAuthGate(
  auth: 'public' | 'required',
  isAuthenticated: boolean,
): AgentsHarmonyAuthGateDecision {
  if (auth === 'public' || isAuthenticated) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'authentication-required' };
}
