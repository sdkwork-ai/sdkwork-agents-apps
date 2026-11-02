/**
 * Settings surface copy (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMpSettingsEnUs = {
  "agents.settings.title": "Settings",
  "agents.settings.language.title": "Language",
  "agents.settings.language.zh": "简体中文",
  "agents.settings.language.en": "English",
  "agents.settings.theme.title": "Theme",
  "agents.settings.theme.system": "Follow system",
  "agents.settings.theme.light": "Light",
  "agents.settings.theme.dark": "Dark",
  "agents.settings.saved": "Settings saved",
  "agents.settings.localNote": "Settings are stored on this device only",
} as const;

export type AgentsMpSettingsMessageKey = keyof typeof agentsMpSettingsEnUs;
