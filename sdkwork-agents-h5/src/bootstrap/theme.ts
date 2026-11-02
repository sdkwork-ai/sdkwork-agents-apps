/**
 * Host theme-mode injection for the H5 root.
 *
 * The light and dark token sets live in `index.css`; this module only resolves
 * the stored preference and writes `data-theme` on the document element so the
 * matching token block applies. `system` is resolved by CSS
 * (`prefers-color-scheme`), not by JavaScript.
 */

export type AgentsH5ThemeMode = "system" | "light" | "dark";

export const AGENTS_H5_THEME_STORAGE_KEY = "sdkwork_agents_h5_theme";

export function normalizeAgentsH5ThemeMode(value: string | null | undefined): AgentsH5ThemeMode {
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveAgentsH5ThemeMode(): AgentsH5ThemeMode {
  try {
    return normalizeAgentsH5ThemeMode(
      globalThis.localStorage?.getItem(AGENTS_H5_THEME_STORAGE_KEY),
    );
  } catch {
    return "system";
  }
}

/** Applies the stored mode; called once before the app renders. */
export function applyAgentsH5ThemePreference(): AgentsH5ThemeMode {
  const mode = resolveAgentsH5ThemeMode();
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = mode;
  }
  return mode;
}

/** Persists and applies a new mode; the settings page renders immediately. */
export function setAgentsH5ThemePreference(mode: AgentsH5ThemeMode): void {
  try {
    globalThis.localStorage?.setItem(AGENTS_H5_THEME_STORAGE_KEY, mode);
  } catch {
    // A blocked storage surface still applies the mode for this session.
  }
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = mode;
  }
}
