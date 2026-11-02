/**
 * Thin i18n boundary for the inspiration capability package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1); the host injects the active locale.
 */

import { agentsInspirationDiscoverEnUs } from "./en-US/agents/inspiration/discover";
import { agentsInspirationDiscoverZhCn } from "./zh-CN/agents/inspiration/discover";

export type AgentsInspirationLocale = "zh-CN" | "en-US";

export type AgentsInspirationMessageKey =
  | keyof typeof agentsInspirationDiscoverZhCn
  | keyof typeof agentsInspirationDiscoverEnUs;

export type AgentsInspirationMessages = Record<string, string>;

export const AGENTS_INSPIRATION_MESSAGES: Record<
  AgentsInspirationLocale,
  AgentsInspirationMessages
> = {
  "zh-CN": agentsInspirationDiscoverZhCn,
  "en-US": agentsInspirationDiscoverEnUs,
};

export const DEFAULT_AGENTS_INSPIRATION_LOCALE: AgentsInspirationLocale = "zh-CN";

let activeLocale: AgentsInspirationLocale = DEFAULT_AGENTS_INSPIRATION_LOCALE;

export function configureAgentsInspirationLocale(locale: AgentsInspirationLocale): void {
  activeLocale = locale;
}

export function getAgentsInspirationLocale(): AgentsInspirationLocale {
  return activeLocale;
}

export function normalizeAgentsInspirationLocale(
  tag: string | null | undefined,
): AgentsInspirationLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function translateAgentsInspirationText(
  key: AgentsInspirationMessageKey | string,
  params?: Record<string, string | number>,
  locale: AgentsInspirationLocale = activeLocale,
): string {
  const template =
    AGENTS_INSPIRATION_MESSAGES[locale]?.[key] ??
    AGENTS_INSPIRATION_MESSAGES[DEFAULT_AGENTS_INSPIRATION_LOCALE][key] ??
    key;
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}
