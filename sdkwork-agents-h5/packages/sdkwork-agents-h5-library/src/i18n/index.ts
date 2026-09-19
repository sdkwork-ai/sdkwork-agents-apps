/**
 * Thin i18n boundary for the library capability package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1); the host injects the active locale.
 */

import { agentsLibraryListEnUs } from "./en-US/agents/library/list";
import { agentsLibraryListZhCn } from "./zh-CN/agents/library/list";

export type AgentsLibraryLocale = "zh-CN" | "en-US";

export type AgentsLibraryMessageKey =
  | keyof typeof agentsLibraryListZhCn
  | keyof typeof agentsLibraryListEnUs;

export type AgentsLibraryMessages = Record<string, string>;

export const AGENTS_LIBRARY_MESSAGES: Record<AgentsLibraryLocale, AgentsLibraryMessages> = {
  "zh-CN": agentsLibraryListZhCn,
  "en-US": agentsLibraryListEnUs,
};

export const DEFAULT_AGENTS_LIBRARY_LOCALE: AgentsLibraryLocale = "zh-CN";

let activeLocale: AgentsLibraryLocale = DEFAULT_AGENTS_LIBRARY_LOCALE;

export function configureAgentsLibraryLocale(locale: AgentsLibraryLocale): void {
  activeLocale = locale;
}

export function getAgentsLibraryLocale(): AgentsLibraryLocale {
  return activeLocale;
}

export function normalizeAgentsLibraryLocale(
  tag: string | null | undefined,
): AgentsLibraryLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function translateAgentsLibraryText(
  key: AgentsLibraryMessageKey | string,
  locale: AgentsLibraryLocale = activeLocale,
): string {
  return (
    AGENTS_LIBRARY_MESSAGES[locale]?.[key] ??
    AGENTS_LIBRARY_MESSAGES[DEFAULT_AGENTS_LIBRARY_LOCALE][key] ??
    key
  );
}
