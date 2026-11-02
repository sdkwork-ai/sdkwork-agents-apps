/**
 * Public integration surface of the Agents H5 settings capability.
 */

export { SettingsScreen } from "./screens/SettingsScreen";
export type { SettingsScreenProps } from "./screens/SettingsScreen";

export {
  configureSettingsPort,
  getSettingsPort,
  resetSettingsPort,
} from "./services/settingsPort";
export type { SettingsPort } from "./services/settingsPort";

export { settingsRouteContributions } from "./routes/settingsRouteContributions";

export {
  AGENTS_SETTINGS_MESSAGES,
  DEFAULT_AGENTS_SETTINGS_LOCALE,
  configureAgentsSettingsLocale,
  getAgentsSettingsLocale,
  normalizeAgentsSettingsLocale,
  translateAgentsSettingsText,
} from "./i18n";
export type { AgentsSettingsLocale, AgentsSettingsMessageKey } from "./i18n";
