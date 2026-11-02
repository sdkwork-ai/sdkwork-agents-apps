/// Persisted user settings models for the Agents Flutter mobile root.
///
/// Copy for the labels lives in the capability's i18n catalog; these enums only
/// carry wire values and message keys.
library;

enum AgentsSettingsLanguage {
  zhCn('zh-CN', 'agents.settings.language.zhCn'),
  enUs('en-US', 'agents.settings.language.enUs');

  const AgentsSettingsLanguage(this.tag, this.labelKey);

  final String tag;
  final String labelKey;

  static AgentsSettingsLanguage fromTag(String? value) {
    return value == 'en-US'
        ? AgentsSettingsLanguage.enUs
        : AgentsSettingsLanguage.zhCn;
  }
}

enum AgentsSettingsTheme {
  system('system', 'agents.settings.theme.system'),
  light('light', 'agents.settings.theme.light'),
  dark('dark', 'agents.settings.theme.dark');

  const AgentsSettingsTheme(this.wireValue, this.labelKey);

  final String wireValue;
  final String labelKey;

  static AgentsSettingsTheme fromWire(String? value) {
    for (final theme in AgentsSettingsTheme.values) {
      if (theme.wireValue == value) {
        return theme;
      }
    }
    return AgentsSettingsTheme.system;
  }
}

class AgentsSettings {
  const AgentsSettings({
    required this.language,
    required this.theme,
    required this.notificationsEnabled,
    required this.autoplayEnabled,
  });

  final AgentsSettingsLanguage language;
  final AgentsSettingsTheme theme;
  final bool notificationsEnabled;
  final bool autoplayEnabled;

  factory AgentsSettings.defaults(String localeTag) {
    return AgentsSettings(
      language: AgentsSettingsLanguage.fromTag(localeTag),
      theme: AgentsSettingsTheme.system,
      notificationsEnabled: true,
      autoplayEnabled: true,
    );
  }

  AgentsSettings copyWith({
    AgentsSettingsLanguage? language,
    AgentsSettingsTheme? theme,
    bool? notificationsEnabled,
    bool? autoplayEnabled,
  }) {
    return AgentsSettings(
      language: language ?? this.language,
      theme: theme ?? this.theme,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      autoplayEnabled: autoplayEnabled ?? this.autoplayEnabled,
    );
  }
}
