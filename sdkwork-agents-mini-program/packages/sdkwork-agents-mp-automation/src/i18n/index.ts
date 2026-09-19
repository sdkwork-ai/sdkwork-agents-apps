/**
 * Thin i18n boundary for the automation capability.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1). This module only types, resolves, and
 * re-exports them; the host injects the active locale (`I18N_SPEC.md` section 7).
 */

import { agentsMpAutomationListEnUs } from "./en-US/agents/automation/list";
import { agentsMpAutomationListZhCn } from "./zh-CN/agents/automation/list";

export type AgentsMpAutomationLocale = "zh-CN" | "en-US";

export const AGENTS_MP_AUTOMATION_MESSAGES: Record<
  AgentsMpAutomationLocale,
  Record<string, string>
> = {
  "zh-CN": agentsMpAutomationListZhCn,
  "en-US": agentsMpAutomationListEnUs,
};

export const DEFAULT_AGENTS_MP_AUTOMATION_LOCALE: AgentsMpAutomationLocale = "zh-CN";

let activeLocale: AgentsMpAutomationLocale = DEFAULT_AGENTS_MP_AUTOMATION_LOCALE;

/** Host injection point for the active locale. */
export function configureAgentsMpAutomationLocale(locale: AgentsMpAutomationLocale): void {
  activeLocale = locale;
}

export function getAgentsMpAutomationLocale(): AgentsMpAutomationLocale {
  return activeLocale;
}

export function normalizeAgentsMpAutomationLocale(
  tag: string | null | undefined,
): AgentsMpAutomationLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

/** Translates a automation key, interpolating `{{name}}` placeholders. */
export function translateAgentsMpAutomationText(
  key: string,
  params?: Record<string, string>,
  locale: AgentsMpAutomationLocale = activeLocale,
): string {
  const template =
    AGENTS_MP_AUTOMATION_MESSAGES[locale]?.[key] ??
    AGENTS_MP_AUTOMATION_MESSAGES[DEFAULT_AGENTS_MP_AUTOMATION_LOCALE][key] ??
    key;
  if (!params) return template;
  return Object.entries(params).reduce(
    (value, [name, replacement]) => value.replaceAll("{{" + name + "}}", replacement),
    template,
  );
}
