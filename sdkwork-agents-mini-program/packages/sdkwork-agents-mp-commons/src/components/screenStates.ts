/**
 * Domain-neutral screen/list state primitives.
 *
 * Capability packages map these to their own data; the primitives stay
 * payload-free so they remain reusable across capabilities.
 */
export type AgentsMpScreenStatus = "loading" | "ready" | "empty" | "error";

export interface AgentsMpScreenState {
  readonly status: AgentsMpScreenStatus;
  readonly errorMessage?: string;
}

export const initialAgentsMpScreenState: AgentsMpScreenState = { status: "loading" };

export function resolveAgentsMpScreenStatus(itemCount: number, loading: boolean, errorMessage?: string): AgentsMpScreenStatus {
  if (loading) {
    return "loading";
  }
  if (typeof errorMessage === "string" && errorMessage.length > 0) {
    return "error";
  }
  return itemCount === 0 ? "empty" : "ready";
}
