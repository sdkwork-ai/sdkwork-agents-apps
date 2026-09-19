/**
 * Host locale injection.
 *
 * Locale resolution belongs to the host, not to feature packages
 * (`I18N_SPEC.md` section 7), so this module is the only place in the H5 root
 * that reads `navigator.language`. Every package's locale is set from the same
 * resolved value so no surface renders a different language than its siblings.
 */

import { configureAgentH5Locale, type AgentH5Locale } from "@sdkwork/agents-h5-agents";
import {
  configureAgentsConversationLocale,
  type AgentsConversationLocale,
} from "@sdkwork/agents-h5-conversation";
import {
  configureAgentsAutomationLocale,
  type AgentsAutomationLocale,
} from "@sdkwork/agents-h5-automation";
import { configureAgentsLibraryLocale, type AgentsLibraryLocale } from "@sdkwork/agents-h5-library";
import { configureAgentsProjectsLocale, type AgentsProjectsLocale } from "@sdkwork/agents-h5-projects";
import { configureAgentsShellLocale, normalizeAgentsShellLocale } from "@sdkwork/agents-h5-shell";

/** Reads the browser language; the single locale source for this root. */
export function detectAgentsH5Locale(): string {
  return typeof navigator !== "undefined" ? navigator.language : "";
}

/** Injects the resolved locale into every capability and shell package. */
export function configureAgentsH5Locale(tag: string = detectAgentsH5Locale()): void {
  const locale: AgentsConversationLocale &
    AgentsLibraryLocale &
    AgentsProjectsLocale &
    AgentsAutomationLocale = normalizeAgentsShellLocale(tag);
  configureAgentsShellLocale(locale);
  configureAgentsConversationLocale(locale);
  configureAgentsLibraryLocale(locale);
  configureAgentsProjectsLocale(locale);
  configureAgentsAutomationLocale(locale);
  // The pre-existing mobile agent views use the short tag form.
  configureAgentH5Locale((tag.toLowerCase().startsWith("en") ? "en" : "zh") satisfies AgentH5Locale);
}
