/**
 * Thin i18n boundary for the Agents H5 shell package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1). This module only types, resolves, and re-exports
 * them; it deliberately does not read `navigator.language` — the host injects
 * the active locale (`I18N_SPEC.md` section 7).
 */

import { agentsShellTabsEnUs } from "./en-US/agents/shell/tabs";
import { agentsShellTabsZhCn } from "./zh-CN/agents/shell/tabs";

export type AgentsShellLocale = "zh-CN" | "en-US";

export type AgentsShellMessageKey =
  | keyof typeof agentsShellTabsZhCn
  | keyof typeof agentsShellTabsEnUs;

export type AgentsShellMessages = Record<string, string>;

export const AGENTS_SHELL_MESSAGES: Record<AgentsShellLocale, AgentsShellMessages> = {
  "zh-CN": agentsShellTabsZhCn,
  "en-US": agentsShellTabsEnUs,
};

/** Default locale of the mobile shell when the host injects none. */
export const DEFAULT_AGENTS_SHELL_LOCALE: AgentsShellLocale = "zh-CN";

let activeAgentsShellLocale: AgentsShellLocale = DEFAULT_AGENTS_SHELL_LOCALE;

/** Host injection point for the active locale. */
export function configureAgentsShellLocale(locale: AgentsShellLocale): void {
  activeAgentsShellLocale = locale;
}

export function getAgentsShellLocale(): AgentsShellLocale {
  return activeAgentsShellLocale;
}

/** Normalizes a BCP 47 tag onto a supported shell locale. */
export function normalizeAgentsShellLocale(tag: string | null | undefined): AgentsShellLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function resolveAgentsShellMessages(
  locale: AgentsShellLocale = activeAgentsShellLocale,
): AgentsShellMessages {
  return AGENTS_SHELL_MESSAGES[locale] ?? AGENTS_SHELL_MESSAGES[DEFAULT_AGENTS_SHELL_LOCALE];
}

/** Translates a shell key, falling back to the key itself. */
export function translateAgentsShellText(
  key: AgentsShellMessageKey | string,
  locale?: AgentsShellLocale,
): string {
  const messages = resolveAgentsShellMessages(locale);
  return messages[key] ?? key;
}
