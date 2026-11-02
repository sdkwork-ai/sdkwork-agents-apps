/**
 * Thin i18n boundary for the settings capability package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1); the host injects the active locale.
 */

import { agentsSettingsIndexEnUs } from "./en-US/agents/settings/index";
import { agentsSettingsIndexZhCn } from "./zh-CN/agents/settings/index";

export type AgentsSettingsLocale = "zh-CN" | "en-US";

export type AgentsSettingsMessageKey =
  | keyof typeof agentsSettingsIndexZhCn
  | keyof typeof agentsSettingsIndexEnUs;

export type AgentsSettingsMessages = Record<string, string>;

export const AGENTS_SETTINGS_MESSAGES: Record<AgentsSettingsLocale, AgentsSettingsMessages> = {
  "zh-CN": agentsSettingsIndexZhCn,
  "en-US": agentsSettingsIndexEnUs,
};

export const DEFAULT_AGENTS_SETTINGS_LOCALE: AgentsSettingsLocale = "zh-CN";

let activeLocale: AgentsSettingsLocale = DEFAULT_AGENTS_SETTINGS_LOCALE;

export function configureAgentsSettingsLocale(locale: AgentsSettingsLocale): void {
  activeLocale = locale;
}

export function getAgentsSettingsLocale(): AgentsSettingsLocale {
  return activeLocale;
}

export function normalizeAgentsSettingsLocale(tag: string | null | undefined): AgentsSettingsLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function translateAgentsSettingsText(
  key: AgentsSettingsMessageKey | string,
  params?: Record<string, string | number>,
  locale: AgentsSettingsLocale = activeLocale,
): string {
  const template =
    AGENTS_SETTINGS_MESSAGES[locale]?.[key] ??
    AGENTS_SETTINGS_MESSAGES[DEFAULT_AGENTS_SETTINGS_LOCALE][key] ??
    key;
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}
