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
  configureAgentsAssetsLocale,
  type AgentsAssetsLocale,
} from "@sdkwork/agents-h5-assets";
import {
  configureAgentsCanvasLocale,
  type AgentsCanvasLocale,
} from "@sdkwork/agents-h5-canvas";
import {
  configureAgentsConversationLocale,
  type AgentsConversationLocale,
} from "@sdkwork/agents-h5-conversation";
import {
  configureAgentsCreativeLocale,
  type AgentsCreativeLocale,
} from "@sdkwork/agents-h5-creative";
import {
  configureAgentsInspirationLocale,
  type AgentsInspirationLocale,
} from "@sdkwork/agents-h5-inspiration";
import {
  configureAgentsMembershipLocale,
  type AgentsMembershipLocale,
} from "@sdkwork/agents-h5-membership";
import {
  configureAgentsProfileLocale,
  type AgentsProfileLocale,
} from "@sdkwork/agents-h5-profile";
import {
  configureAgentsSettingsLocale,
  type AgentsSettingsLocale,
} from "@sdkwork/agents-h5-settings";
import {
  configureAgentsAutomationLocale,
  type AgentsAutomationLocale,
} from "@sdkwork/agents-h5-automation";
import { configureAgentsLibraryLocale, type AgentsLibraryLocale } from "@sdkwork/agents-h5-library";
import { configureAgentsProjectsLocale, type AgentsProjectsLocale } from "@sdkwork/agents-h5-projects";
import { configureAgentsShellLocale, normalizeAgentsShellLocale } from "@sdkwork/agents-h5-shell";

/** Local preference key; a stored value wins over `navigator.language`. */
export const AGENTS_H5_LOCALE_STORAGE_KEY = "sdkwork_agents_h5_locale";

/** Reads the browser language; the single locale source for this root. */
export function detectAgentsH5Locale(): string {
  try {
    const stored = globalThis.localStorage?.getItem(AGENTS_H5_LOCALE_STORAGE_KEY);
    if (stored) {
      return stored;
    }
  } catch {
    // A blocked storage surface falls back to the browser language.
  }
  return typeof navigator !== "undefined" ? navigator.language : "";
}

/** Persists the chosen locale before the host reloads the app. */
export function setAgentsH5LocalePreference(tag: string): void {
  try {
    globalThis.localStorage?.setItem(AGENTS_H5_LOCALE_STORAGE_KEY, normalizeAgentsShellLocale(tag));
  } catch {
    // Storage may be blocked; the caller still reloads with the browser locale.
  }
}

/** Injects the resolved locale into every capability and shell package. */
export function configureAgentsH5Locale(tag: string = detectAgentsH5Locale()): void {
  const locale: AgentsConversationLocale &
    AgentsLibraryLocale &
    AgentsProjectsLocale &
    AgentsAutomationLocale &
    AgentsAssetsLocale &
    AgentsCanvasLocale &
    AgentsCreativeLocale &
    AgentsInspirationLocale &
    AgentsMembershipLocale &
    AgentsProfileLocale &
    AgentsSettingsLocale = normalizeAgentsShellLocale(tag);
  configureAgentsShellLocale(locale);
  configureAgentsConversationLocale(locale);
  configureAgentsLibraryLocale(locale);
  configureAgentsProjectsLocale(locale);
  configureAgentsAutomationLocale(locale);
  configureAgentsAssetsLocale(locale);
  configureAgentsCanvasLocale(locale);
  configureAgentsCreativeLocale(locale);
  configureAgentsInspirationLocale(locale);
  configureAgentsMembershipLocale(locale);
  configureAgentsProfileLocale(locale);
  configureAgentsSettingsLocale(locale);
  // The pre-existing mobile agent views use the short tag form.
  configureAgentH5Locale((tag.toLowerCase().startsWith("en") ? "en" : "zh") satisfies AgentH5Locale);
}
