import {
  readAgentsMpLocaleTag,
  readAgentsMpWindowInsets,
  type AgentsMpWindowInsets,
} from "@sdkwork/agents-mp-host";

/**
 * Host adapter registration for the mini program root.
 *
 * Platform APIs enter the application only through `@sdkwork/agents-mp-host`
 * (`APP_MINI_PROGRAM_UI_SPEC.md` section 1); this module caches the values that
 * are stable for the whole session and hands them to pages.
 */

let cachedInsets: AgentsMpWindowInsets | null = null;

export interface AgentsMpHostAdapters {
  readonly insets: AgentsMpWindowInsets;
  readonly localeTag?: string;
}

/** Reads and caches the session-stable platform values. */
export function registerHostAdapters(): AgentsMpHostAdapters {
  cachedInsets = readAgentsMpWindowInsets();
  const localeTag = readAgentsMpLocaleTag();
  return { insets: cachedInsets, ...(localeTag ? { localeTag } : {}) };
}

/** Returns the window insets, reading them on first use when launch skipped. */
export function getAgentsMpWindowInsets(): AgentsMpWindowInsets {
  if (!cachedInsets) {
    cachedInsets = readAgentsMpWindowInsets();
  }
  return cachedInsets;
}

export { readAgentsMpLocaleTag };
