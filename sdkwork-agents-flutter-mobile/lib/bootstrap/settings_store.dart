/// Persisted settings adapter for the Agents Flutter mobile root.
///
/// `shared_preferences` is a host storage API, so it lives in the composition
/// root; the profile package depends only on [AgentsSettingsStore]. The adapter
/// reads and writes inside async methods, never during build.
library;

import 'package:shared_preferences/shared_preferences.dart';
import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';

const String agentsSettingsLanguageKey = 'agents.settings.language';
const String agentsSettingsThemeKey = 'agents.settings.theme';
const String agentsSettingsNotificationsKey = 'agents.settings.notifications';
const String agentsSettingsAutoplayKey = 'agents.settings.autoplay';

AgentsSettingsStore createSharedPreferencesAgentsSettingsStore() {
  return const SharedPreferencesAgentsSettingsStore();
}

class SharedPreferencesAgentsSettingsStore implements AgentsSettingsStore {
  const SharedPreferencesAgentsSettingsStore();

  @override
  Future<AgentsSettings?> load() async {
    final preferences = await SharedPreferences.getInstance();
    final hasLanguage = preferences.containsKey(agentsSettingsLanguageKey);
    final hasTheme = preferences.containsKey(agentsSettingsThemeKey);
    final hasNotifications = preferences.containsKey(
      agentsSettingsNotificationsKey,
    );
    final hasAutoplay = preferences.containsKey(agentsSettingsAutoplayKey);
    if (!hasLanguage && !hasTheme && !hasNotifications && !hasAutoplay) {
      return null;
    }
    final defaults = AgentsSettings.defaults('zh-CN');
    return AgentsSettings(
      language: AgentsSettingsLanguage.fromTag(
        preferences.getString(agentsSettingsLanguageKey),
      ),
      theme: AgentsSettingsTheme.fromWire(
        preferences.getString(agentsSettingsThemeKey),
      ),
      notificationsEnabled:
          preferences.getBool(agentsSettingsNotificationsKey) ??
          defaults.notificationsEnabled,
      autoplayEnabled:
          preferences.getBool(agentsSettingsAutoplayKey) ??
          defaults.autoplayEnabled,
    );
  }

  @override
  Future<void> save(AgentsSettings settings) async {
    final preferences = await SharedPreferences.getInstance();
    final saved = await Future.wait<bool>(<Future<bool>>[
      preferences.setString(agentsSettingsLanguageKey, settings.language.tag),
      preferences.setString(agentsSettingsThemeKey, settings.theme.wireValue),
      preferences.setBool(
        agentsSettingsNotificationsKey,
        settings.notificationsEnabled,
      ),
      preferences.setBool(agentsSettingsAutoplayKey, settings.autoplayEnabled),
    ]);
    if (saved.any((bool value) => !value)) {
      throw StateError('One or more settings could not be persisted.');
    }
  }
}
