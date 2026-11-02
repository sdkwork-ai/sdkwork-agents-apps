/**
 * Thin i18n boundary for the membership capability package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1); the host injects the active locale.
 */

import { agentsMembershipCatalogEnUs } from "./en-US/agents/membership/catalog";
import { agentsMembershipCatalogZhCn } from "./zh-CN/agents/membership/catalog";

export type AgentsMembershipLocale = "zh-CN" | "en-US";

export type AgentsMembershipMessageKey =
  | keyof typeof agentsMembershipCatalogZhCn
  | keyof typeof agentsMembershipCatalogEnUs;

export type AgentsMembershipMessages = Record<string, string>;

export const AGENTS_MEMBERSHIP_MESSAGES: Record<
  AgentsMembershipLocale,
  AgentsMembershipMessages
> = {
  "zh-CN": agentsMembershipCatalogZhCn,
  "en-US": agentsMembershipCatalogEnUs,
};

export const DEFAULT_AGENTS_MEMBERSHIP_LOCALE: AgentsMembershipLocale = "zh-CN";

let activeLocale: AgentsMembershipLocale = DEFAULT_AGENTS_MEMBERSHIP_LOCALE;

export function configureAgentsMembershipLocale(locale: AgentsMembershipLocale): void {
  activeLocale = locale;
}

export function getAgentsMembershipLocale(): AgentsMembershipLocale {
  return activeLocale;
}

export function normalizeAgentsMembershipLocale(
  tag: string | null | undefined,
): AgentsMembershipLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function translateAgentsMembershipText(
  key: AgentsMembershipMessageKey | string,
  params?: Record<string, string | number>,
  locale: AgentsMembershipLocale = activeLocale,
): string {
  const template =
    AGENTS_MEMBERSHIP_MESSAGES[locale]?.[key] ??
    AGENTS_MEMBERSHIP_MESSAGES[DEFAULT_AGENTS_MEMBERSHIP_LOCALE][key] ??
    key;
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}
