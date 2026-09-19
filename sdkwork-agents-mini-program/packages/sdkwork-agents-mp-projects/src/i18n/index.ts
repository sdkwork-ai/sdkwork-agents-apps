/**
 * Thin i18n boundary for the projects capability.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1). This module only types, resolves, and
 * re-exports them; the host injects the active locale (`I18N_SPEC.md` section 7).
 */

import { agentsMpProjectsListEnUs } from "./en-US/agents/projects/list";
import { agentsMpProjectsListZhCn } from "./zh-CN/agents/projects/list";

export type AgentsMpProjectsLocale = "zh-CN" | "en-US";

export const AGENTS_MP_PROJECTS_MESSAGES: Record<
  AgentsMpProjectsLocale,
  Record<string, string>
> = {
  "zh-CN": agentsMpProjectsListZhCn,
  "en-US": agentsMpProjectsListEnUs,
};

export const DEFAULT_AGENTS_MP_PROJECTS_LOCALE: AgentsMpProjectsLocale = "zh-CN";

let activeLocale: AgentsMpProjectsLocale = DEFAULT_AGENTS_MP_PROJECTS_LOCALE;

/** Host injection point for the active locale. */
export function configureAgentsMpProjectsLocale(locale: AgentsMpProjectsLocale): void {
  activeLocale = locale;
}

export function getAgentsMpProjectsLocale(): AgentsMpProjectsLocale {
  return activeLocale;
}

export function normalizeAgentsMpProjectsLocale(
  tag: string | null | undefined,
): AgentsMpProjectsLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

/** Translates a projects key, interpolating `{{name}}` placeholders. */
export function translateAgentsMpProjectsText(
  key: string,
  params?: Record<string, string>,
  locale: AgentsMpProjectsLocale = activeLocale,
): string {
  const template =
    AGENTS_MP_PROJECTS_MESSAGES[locale]?.[key] ??
    AGENTS_MP_PROJECTS_MESSAGES[DEFAULT_AGENTS_MP_PROJECTS_LOCALE][key] ??
    key;
  if (!params) return template;
  return Object.entries(params).reduce(
    (value, [name, replacement]) => value.replaceAll("{{" + name + "}}", replacement),
    template,
  );
}
