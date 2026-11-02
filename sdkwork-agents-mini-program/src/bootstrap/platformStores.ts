import {
  type AgentsMpCreativeRun,
  type AgentsMpCreativeRunStore,
  type AgentsMpProfilePort,
} from "@sdkwork/agents-mp-core/capabilities";
import { readAppSdkSessionTokens } from "@sdkwork/agents-mp-core/session";

/**
 * Device-storage adapters for the M1 capability services.
 *
 * `wx.*` access is confined to this bootstrap module, so `mp-core` capability
 * services stay platform-free and testable
 * (`APP_MINI_PROGRAM_UI_SPEC.md` section 1). Every adapter degrades to an empty
 * value instead of throwing, because a device that refuses storage must still
 * render the screen.
 */

/** Device key for the creative studio's local run log. */
export const AGENTS_MP_CREATIVE_RUNS_STORAGE_KEY = "sdkwork-agents-mp:creative-runs:v1";

/** Device key for the locale preference chosen on the settings page. */
export const AGENTS_MP_LOCALE_STORAGE_KEY = "sdkwork-agents-mp:locale:v1";

/** Device key for the theme preference chosen on the settings page. */
export const AGENTS_MP_THEME_STORAGE_KEY = "sdkwork-agents-mp:theme:v1";

/** Access-token key shared with the IAM login bridge (`src/app.js`). */
const ACCESS_TOKEN_STORAGE_KEY = "sdkwork.accessToken";

interface AgentsMpStorageHost {
  getStorageSync?: (key: string) => unknown;
  setStorageSync?: (key: string, value: unknown) => void;
  removeStorageSync?: (key: string) => void;
}

interface AgentsMpAppLike {
  globalData?: {
    sdkworkProfileId?: string;
    sdkworkAccessToken?: string;
  };
}

function readHost(): AgentsMpStorageHost | undefined {
  return (globalThis as { wx?: AgentsMpStorageHost }).wx;
}

/** Reads a stored string value, or `null` when absent/unreadable. */
export function readStoredString(key: string): string | null {
  try {
    const value = readHost()?.getStorageSync?.(key);
    return typeof value === "string" && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Writes a string value; a refused write is ignored by the caller's design. */
export function writeStoredString(key: string, value: string): void {
  try {
    readHost()?.setStorageSync?.(key, value);
  } catch {
    // Storage failures never fail a completed screen action.
  }
}

function readApp(): AgentsMpAppLike | undefined {
  try {
    const getAppFn = (globalThis as { getApp?: () => AgentsMpAppLike }).getApp;
    return getAppFn?.();
  } catch {
    return undefined;
  }
}

/** True when the IAM bridge stored an access token for this session. */
export function readSignedIn(): boolean {
  const sessionToken = readAppSdkSessionTokens()?.accessToken;
  if (typeof sessionToken === "string" && sessionToken.trim().length > 0) {
    return true;
  }
  const globalToken = readApp()?.globalData?.sdkworkAccessToken;
  if (typeof globalToken === "string" && globalToken.trim().length > 0) {
    return true;
  }
  const storedToken = readStoredString(ACCESS_TOKEN_STORAGE_KEY);
  return typeof storedToken === "string" && storedToken.length > 0;
}

/** The runtime profile id the build was produced for. */
export function readRuntimeEnvironment(): string {
  const profileId = readApp()?.globalData?.sdkworkProfileId;
  return typeof profileId === "string" ? profileId : "";
}

function parseCreativeRuns(raw: string | null): AgentsMpCreativeRun[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is AgentsMpCreativeRun => {
      if (!entry || typeof entry !== "object") {
        return false;
      }
      const run = entry as { id?: unknown; prompt?: unknown; media?: unknown };
      return typeof run.id === "string" && typeof run.prompt === "string" && Array.isArray(run.media);
    });
  } catch {
    return [];
  }
}

/** Device-local creative run log backed by platform storage. */
export function createCreativeRunStore(): AgentsMpCreativeRunStore {
  return {
    read() {
      return parseCreativeRuns(readStoredString(AGENTS_MP_CREATIVE_RUNS_STORAGE_KEY));
    },
    write(runs) {
      writeStoredString(AGENTS_MP_CREATIVE_RUNS_STORAGE_KEY, JSON.stringify(runs));
    },
  };
}

/** Profile port backed by the device store and the session token. */
export function createProfilePort(): AgentsMpProfilePort {
  return {
    readSignedIn,
    readEnvironment: readRuntimeEnvironment,
    readStorage: readStoredString,
    writeStorage: writeStoredString,
  };
}

/** Theme preference persisted on the settings page. */
export type AgentsMpThemePreference = "system" | "light" | "dark";

interface AgentsMpAppearanceHost {
  setBackgroundColor?: (options: { backgroundColor: string; backgroundColorTop?: string; backgroundColorBottom?: string }) => void;
  setNavigationBarColor?: (options: {
    frontColor: string;
    backgroundColor: string;
    animation?: { duration?: number; timingFunc?: string };
  }) => void;
  getAppBaseInfo?: () => { theme?: string };
  getSystemInfoSync?: () => { theme?: string };
}

interface AgentsMpThemePalette {
  readonly background: string;
  readonly navigationBackground: string;
  /** WeChat only accepts `#ffffff` or `#000000` here. */
  readonly navigationFront: string;
}

const THEME_PALETTES: Record<"light" | "dark", AgentsMpThemePalette> = {
  light: {
    background: "#F4F7FC",
    navigationBackground: "#FFFFFF",
    navigationFront: "#000000",
  },
  dark: {
    background: "#0A1B3D",
    navigationBackground: "#0A1B3D",
    navigationFront: "#ffffff",
  },
};

function readSystemTheme(): "light" | "dark" {
  const host = globalThis as { wx?: AgentsMpAppearanceHost };
  try {
    const theme = host.wx?.getAppBaseInfo?.().theme ?? host.wx?.getSystemInfoSync?.().theme;
    return theme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/**
 * Applies the window chrome for a theme preference.
 *
 * Mini program pages cannot restyle the platform window from WXSS, so the stored
 * preference is applied to the window background and navigation bar. Page-level
 * surfaces use the same preference through `themeClass`.
 */
export function applyAgentsMpTheme(theme: AgentsMpThemePreference): "light" | "dark" {
  const resolved = theme === "system" ? readSystemTheme() : theme;
  const palette = THEME_PALETTES[resolved];
  const host = globalThis as { wx?: AgentsMpAppearanceHost };
  try {
    host.wx?.setBackgroundColor?.({
      backgroundColor: palette.background,
      backgroundColorTop: palette.background,
      backgroundColorBottom: palette.background,
    });
    host.wx?.setNavigationBarColor?.({
      frontColor: palette.navigationFront,
      backgroundColor: palette.navigationBackground,
    });
  } catch {
    // Platform chrome is best-effort; the page still renders.
  }
  return resolved;
}

/**
 * Resolves the stored theme preference to the page-root class.
 *
 * Every page calls this from `onShow` so the in-app preference (system/light/
 * dark) styles page content, not only the platform window chrome. The window
 * chrome is re-applied here as well, which keeps the navigation bar and the page
 * background in sync after the user changes the preference on Settings and
 * returns to an already-mounted page.
 */
export function resolveAgentsMpThemeClass(): "" | "theme-dark" {
  let stored: string | null = null;
  try {
    stored = readStoredString(AGENTS_MP_THEME_STORAGE_KEY);
  } catch {
    stored = null;
  }
  const preference: AgentsMpThemePreference =
    stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  return applyAgentsMpTheme(preference) === "dark" ? "theme-dark" : "";
}
