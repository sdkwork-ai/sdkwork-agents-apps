/**
 * Thin i18n boundary for the automation capability package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1); the host injects the active locale.
 */

import { agentsAutomationIndexEnUs } from "./en-US/agents/automation/index";
import { agentsAutomationIndexZhCn } from "./zh-CN/agents/automation/index";

export type AgentsAutomationLocale = "zh-CN" | "en-US";

export type AgentsAutomationMessageKey =
  | keyof typeof agentsAutomationIndexZhCn
  | keyof typeof agentsAutomationIndexEnUs;

export type AgentsAutomationMessages = Record<string, string>;

export const AGENTS_AUTOMATION_MESSAGES: Record<AgentsAutomationLocale, AgentsAutomationMessages> =
  {
    "zh-CN": agentsAutomationIndexZhCn,
    "en-US": agentsAutomationIndexEnUs,
  };

export const DEFAULT_AGENTS_AUTOMATION_LOCALE: AgentsAutomationLocale = "zh-CN";

let activeLocale: AgentsAutomationLocale = DEFAULT_AGENTS_AUTOMATION_LOCALE;

export function configureAgentsAutomationLocale(locale: AgentsAutomationLocale): void {
  activeLocale = locale;
}

export function getAgentsAutomationLocale(): AgentsAutomationLocale {
  return activeLocale;
}

export function normalizeAgentsAutomationLocale(
  tag: string | null | undefined,
): AgentsAutomationLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function translateAgentsAutomationText(
  key: AgentsAutomationMessageKey | string,
  locale: AgentsAutomationLocale = activeLocale,
): string {
  return (
    AGENTS_AUTOMATION_MESSAGES[locale]?.[key] ??
    AGENTS_AUTOMATION_MESSAGES[DEFAULT_AGENTS_AUTOMATION_LOCALE][key] ??
    key
  );
}
