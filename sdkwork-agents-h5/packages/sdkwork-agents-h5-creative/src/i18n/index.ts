/**
 * Thin i18n boundary for the creative capability package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1); the host injects the active locale.
 */

import { agentsCreativeStudioEnUs } from "./en-US/agents/creative/studio";
import { agentsCreativeStudioZhCn } from "./zh-CN/agents/creative/studio";

export type AgentsCreativeLocale = "zh-CN" | "en-US";

export type AgentsCreativeMessageKey =
  | keyof typeof agentsCreativeStudioZhCn
  | keyof typeof agentsCreativeStudioEnUs;

export type AgentsCreativeMessages = Record<string, string>;

export const AGENTS_CREATIVE_MESSAGES: Record<AgentsCreativeLocale, AgentsCreativeMessages> = {
  "zh-CN": agentsCreativeStudioZhCn,
  "en-US": agentsCreativeStudioEnUs,
};

export const DEFAULT_AGENTS_CREATIVE_LOCALE: AgentsCreativeLocale = "zh-CN";

let activeLocale: AgentsCreativeLocale = DEFAULT_AGENTS_CREATIVE_LOCALE;

export function configureAgentsCreativeLocale(locale: AgentsCreativeLocale): void {
  activeLocale = locale;
}

export function getAgentsCreativeLocale(): AgentsCreativeLocale {
  return activeLocale;
}

export function normalizeAgentsCreativeLocale(
  tag: string | null | undefined,
): AgentsCreativeLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function translateAgentsCreativeText(
  key: AgentsCreativeMessageKey | string,
  params?: Record<string, string | number>,
  locale: AgentsCreativeLocale = activeLocale,
): string {
  const template =
    AGENTS_CREATIVE_MESSAGES[locale]?.[key] ??
    AGENTS_CREATIVE_MESSAGES[DEFAULT_AGENTS_CREATIVE_LOCALE][key] ??
    key;
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}
