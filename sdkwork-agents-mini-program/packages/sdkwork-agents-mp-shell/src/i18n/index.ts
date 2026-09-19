/**
 * Thin i18n boundary for the Agents mini program shell package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1). This module only types, resolves, and re-exports
 * them; it deliberately does not read the platform locale — the host injects the
 * active locale (`I18N_SPEC.md` section 7).
 */

import { agentsMpShellTabsEnUs } from "./en-US/agents/shell/tabs";
import { agentsMpShellTabsZhCn } from "./zh-CN/agents/shell/tabs";

export type AgentsMpShellLocale = "zh-CN" | "en-US";

export type AgentsMpShellMessages = Record<string, string>;

export const AGENTS_MP_SHELL_MESSAGES: Record<AgentsMpShellLocale, AgentsMpShellMessages> = {
  "zh-CN": agentsMpShellTabsZhCn,
  "en-US": agentsMpShellTabsEnUs,
};

/** Default locale of the mobile shell when the host injects none. */
export const DEFAULT_AGENTS_MP_SHELL_LOCALE: AgentsMpShellLocale = "zh-CN";

let activeAgentsMpShellLocale: AgentsMpShellLocale = DEFAULT_AGENTS_MP_SHELL_LOCALE;

/** Host injection point for the active locale. */
export function configureAgentsMpShellLocale(locale: AgentsMpShellLocale): void {
  activeAgentsMpShellLocale = locale;
}

export function getAgentsMpShellLocale(): AgentsMpShellLocale {
  return activeAgentsMpShellLocale;
}

/** Normalizes a BCP 47 tag (or WeChat `language`) onto a supported locale. */
export function normalizeAgentsMpShellLocale(tag: string | null | undefined): AgentsMpShellLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function resolveAgentsMpShellMessages(
  locale: AgentsMpShellLocale = activeAgentsMpShellLocale,
): AgentsMpShellMessages {
  return AGENTS_MP_SHELL_MESSAGES[locale] ?? AGENTS_MP_SHELL_MESSAGES[DEFAULT_AGENTS_MP_SHELL_LOCALE];
}

/** Translates a shell key, falling back to the key itself. */
export function translateAgentsMpShellText(
  key: string,
  locale?: AgentsMpShellLocale,
): string {
  return resolveAgentsMpShellMessages(locale)[key] ?? key;
}
