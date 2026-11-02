/**
 * Settings surface copy (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMpSettingsZhCn = {
  "agents.settings.title": "设置",
  "agents.settings.language.title": "语言",
  "agents.settings.language.zh": "简体中文",
  "agents.settings.language.en": "English",
  "agents.settings.theme.title": "主题",
  "agents.settings.theme.system": "跟随系统",
  "agents.settings.theme.light": "浅色",
  "agents.settings.theme.dark": "深色",
  "agents.settings.saved": "设置已保存",
  "agents.settings.localNote": "设置仅保存在本机",
} as const;

export type AgentsMpSettingsMessageKey = keyof typeof agentsMpSettingsZhCn;
