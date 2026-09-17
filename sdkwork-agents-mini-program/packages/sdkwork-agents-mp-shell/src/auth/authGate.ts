/**
 * AuthGate integration for the mini program shell.
 *
 * Route guards are shell/runtime responsibilities. Capability packages declare
 * auth mode and permission hints only.
 */
export interface AgentsMpAuthGateDecision {
  readonly allowed: boolean;
  readonly redirectPagePath?: string;
  readonly reason?: string;
}

export function evaluateAgentsMpAuthGate(
  auth: "public" | "required",
  isAuthenticated: boolean,
  loginPagePath = "pages/home/index",
): AgentsMpAuthGateDecision {
  if (auth === "public" || isAuthenticated) {
    return { allowed: true };
  }
  return { allowed: false, redirectPagePath: loginPagePath, reason: "authentication-required" };
}
