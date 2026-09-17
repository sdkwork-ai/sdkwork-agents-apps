/**
 * Thin locale boundary for the agents mini program capability family.
 *
 * Authority: `I18N_SPEC.md` section 6.1. Thin boundaries (`index`, `manifest`,
 * `locale`, `locales`, `registry`, `runtime`, `types`, provider) may normalize,
 * look up, register, or type fragments; they MUST NOT author feature copy. The
 * authored fragments live under `<locale>/<domain>/<capability>/<fragment>.ts`.
 */
export type AgentsMpLocale = "en-US" | "zh-CN";

export function normalizeAgentsMpLocale(value: string): AgentsMpLocale {
  return value.trim().toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}

export function pickAgentsMpMessage(
  fragment: Record<string, string>,
  key: string,
  fallback: string,
): string {
  const value = fragment[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
