/**
 * Thin i18n boundary for the library capability.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1). This module only types, resolves, and
 * re-exports them; the host injects the active locale (`I18N_SPEC.md` section 7).
 */

import { agentsMpLibraryListEnUs } from "./en-US/agents/library/list";
import { agentsMpLibraryListZhCn } from "./zh-CN/agents/library/list";

export type AgentsMpLibraryLocale = "zh-CN" | "en-US";

export const AGENTS_MP_LIBRARY_MESSAGES: Record<
  AgentsMpLibraryLocale,
  Record<string, string>
> = {
  "zh-CN": agentsMpLibraryListZhCn,
  "en-US": agentsMpLibraryListEnUs,
};

export const DEFAULT_AGENTS_MP_LIBRARY_LOCALE: AgentsMpLibraryLocale = "zh-CN";

let activeLocale: AgentsMpLibraryLocale = DEFAULT_AGENTS_MP_LIBRARY_LOCALE;

/** Host injection point for the active locale. */
export function configureAgentsMpLibraryLocale(locale: AgentsMpLibraryLocale): void {
  activeLocale = locale;
}

export function getAgentsMpLibraryLocale(): AgentsMpLibraryLocale {
  return activeLocale;
}

export function normalizeAgentsMpLibraryLocale(
  tag: string | null | undefined,
): AgentsMpLibraryLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

/** Translates a library key, interpolating `{{name}}` placeholders. */
export function translateAgentsMpLibraryText(
  key: string,
  params?: Record<string, string>,
  locale: AgentsMpLibraryLocale = activeLocale,
): string {
  const template =
    AGENTS_MP_LIBRARY_MESSAGES[locale]?.[key] ??
    AGENTS_MP_LIBRARY_MESSAGES[DEFAULT_AGENTS_MP_LIBRARY_LOCALE][key] ??
    key;
  if (!params) return template;
  return Object.entries(params).reduce(
    (value, [name, replacement]) => value.replaceAll("{{" + name + "}}", replacement),
    template,
  );
}
