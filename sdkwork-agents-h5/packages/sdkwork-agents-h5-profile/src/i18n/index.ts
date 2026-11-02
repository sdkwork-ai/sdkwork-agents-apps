/**
 * Thin i18n boundary for the profile capability package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1); the host injects the active locale.
 */

import { agentsProfileIndexEnUs } from "./en-US/agents/profile/index";
import { agentsProfileIndexZhCn } from "./zh-CN/agents/profile/index";

export type AgentsProfileLocale = "zh-CN" | "en-US";

export type AgentsProfileMessageKey =
  | keyof typeof agentsProfileIndexZhCn
  | keyof typeof agentsProfileIndexEnUs;

export type AgentsProfileMessages = Record<string, string>;

export const AGENTS_PROFILE_MESSAGES: Record<AgentsProfileLocale, AgentsProfileMessages> = {
  "zh-CN": agentsProfileIndexZhCn,
  "en-US": agentsProfileIndexEnUs,
};

export const DEFAULT_AGENTS_PROFILE_LOCALE: AgentsProfileLocale = "zh-CN";

let activeLocale: AgentsProfileLocale = DEFAULT_AGENTS_PROFILE_LOCALE;

export function configureAgentsProfileLocale(locale: AgentsProfileLocale): void {
  activeLocale = locale;
}

export function getAgentsProfileLocale(): AgentsProfileLocale {
  return activeLocale;
}

export function normalizeAgentsProfileLocale(tag: string | null | undefined): AgentsProfileLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function translateAgentsProfileText(
  key: AgentsProfileMessageKey | string,
  params?: Record<string, string | number>,
  locale: AgentsProfileLocale = activeLocale,
): string {
  const template =
    AGENTS_PROFILE_MESSAGES[locale]?.[key] ??
    AGENTS_PROFILE_MESSAGES[DEFAULT_AGENTS_PROFILE_LOCALE][key] ??
    key;
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}
