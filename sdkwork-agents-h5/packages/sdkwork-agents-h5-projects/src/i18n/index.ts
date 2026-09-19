/**
 * Thin i18n boundary for the projects capability package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1); the host injects the active locale.
 */

import { agentsProjectsListEnUs } from "./en-US/agents/projects/list";
import { agentsProjectsListZhCn } from "./zh-CN/agents/projects/list";

export type AgentsProjectsLocale = "zh-CN" | "en-US";

export type AgentsProjectsMessageKey =
  | keyof typeof agentsProjectsListZhCn
  | keyof typeof agentsProjectsListEnUs;

export type AgentsProjectsMessages = Record<string, string>;

export const AGENTS_PROJECTS_MESSAGES: Record<AgentsProjectsLocale, AgentsProjectsMessages> = {
  "zh-CN": agentsProjectsListZhCn,
  "en-US": agentsProjectsListEnUs,
};

export const DEFAULT_AGENTS_PROJECTS_LOCALE: AgentsProjectsLocale = "zh-CN";

let activeLocale: AgentsProjectsLocale = DEFAULT_AGENTS_PROJECTS_LOCALE;

export function configureAgentsProjectsLocale(locale: AgentsProjectsLocale): void {
  activeLocale = locale;
}

export function getAgentsProjectsLocale(): AgentsProjectsLocale {
  return activeLocale;
}

export function normalizeAgentsProjectsLocale(
  tag: string | null | undefined,
): AgentsProjectsLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function translateAgentsProjectsText(
  key: AgentsProjectsMessageKey | string,
  params?: Record<string, string>,
  locale: AgentsProjectsLocale = activeLocale,
): string {
  const template =
    AGENTS_PROJECTS_MESSAGES[locale]?.[key] ??
    AGENTS_PROJECTS_MESSAGES[DEFAULT_AGENTS_PROJECTS_LOCALE][key] ??
    key;
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, value),
    template,
  );
}
