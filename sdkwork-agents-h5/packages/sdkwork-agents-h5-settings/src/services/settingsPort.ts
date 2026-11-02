/**
 * Settings port (`app.agents.settings.index`).
 *
 * The settings surface owns presentation only. Session teardown, local cache
 * clearing, and environment facts belong to the host composition root, which
 * injects this port (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 8).
 */
export interface SettingsPort {
  readonly environment: string;
  readonly accountLabel: string;
  readonly localeLabel: string;
  /** Persists the chosen UI locale; the host reloads to apply it everywhere. */
  setLocale(locale: "zh-CN" | "en-US"): void;
  readonly themeLabel: "system" | "light" | "dark";
  /** Applies and persists the theme mode without a reload. */
  setTheme(theme: "system" | "light" | "dark"): void;
  /** Clears device-local caches owned by the app (not server state). */
  clearLocalCache(): void;
  /** Ends the local session and returns the user to the login gate. */
  signOut(): void;
}

let settingsPort: SettingsPort | null = null;

export function configureSettingsPort(port: SettingsPort | null): void {
  settingsPort = port;
}

export function getSettingsPort(): SettingsPort | null {
  return settingsPort;
}

export function resetSettingsPort(): void {
  settingsPort = null;
}
