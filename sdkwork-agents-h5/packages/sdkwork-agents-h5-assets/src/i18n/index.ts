/**
 * Thin i18n boundary for the assets capability package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1); the host injects the active locale.
 */

import { agentsAssetsListEnUs } from "./en-US/agents/assets/list";
import { agentsAssetsListZhCn } from "./zh-CN/agents/assets/list";

export type AgentsAssetsLocale = "zh-CN" | "en-US";

export type AgentsAssetsMessageKey =
  | keyof typeof agentsAssetsListZhCn
  | keyof typeof agentsAssetsListEnUs;

export type AgentsAssetsMessages = Record<string, string>;

export const AGENTS_ASSETS_MESSAGES: Record<AgentsAssetsLocale, AgentsAssetsMessages> = {
  "zh-CN": agentsAssetsListZhCn,
  "en-US": agentsAssetsListEnUs,
};

export const DEFAULT_AGENTS_ASSETS_LOCALE: AgentsAssetsLocale = "zh-CN";

let activeLocale: AgentsAssetsLocale = DEFAULT_AGENTS_ASSETS_LOCALE;

export function configureAgentsAssetsLocale(locale: AgentsAssetsLocale): void {
  activeLocale = locale;
}

export function getAgentsAssetsLocale(): AgentsAssetsLocale {
  return activeLocale;
}

export function normalizeAgentsAssetsLocale(tag: string | null | undefined): AgentsAssetsLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function translateAgentsAssetsText(
  key: AgentsAssetsMessageKey | string,
  params?: Record<string, string | number>,
  locale: AgentsAssetsLocale = activeLocale,
): string {
  const template =
    AGENTS_ASSETS_MESSAGES[locale]?.[key] ??
    AGENTS_ASSETS_MESSAGES[DEFAULT_AGENTS_ASSETS_LOCALE][key] ??
    key;
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}
