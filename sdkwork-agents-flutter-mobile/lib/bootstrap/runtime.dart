import 'package:flutter/material.dart' show ThemeMode;
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

import 'host_adapters.dart';
import 'iam_runtime.dart';
import 'routes.dart';
import 'sdk_clients.dart';
import 'services.dart';
import 'settings_store.dart';

class AgentsMobileRuntime {
  const AgentsMobileRuntime({
    required this.sdkClients,
    required this.services,
    required this.routes,
    required this.adapters,
    required this.localeTag,
    required this.tabs,
    this.themeMode = ThemeMode.system,
  });

  final SdkClients sdkClients;
  final AgentsMobileServices services;
  final AgentsMobileRoutes routes;
  final AgentsHostAdapters adapters;

  /// Persisted appearance choice, resolved before the first frame so a saved
  /// dark or light preference never flashes the other theme.
  final ThemeMode themeMode;

  /// Canonical locale tag (`zh-CN` / `en-US`) every capability is configured
  /// with. Feature packages never resolve the platform locale themselves
  /// (`I18N_SPEC.md` section 7).
  final String localeTag;

  final List<AgentsMobileTabDescriptor> tabs;
}

Future<AgentsMobileRuntime> bootstrap({String? localeTag}) async {
  createIamRuntime();
  final adapters = registerHostAdapters();
  final sdkClients = createSdkClients();
  final settingsStore = createSharedPreferencesAgentsSettingsStore();
  // A language chosen in Settings takes effect on the next launch. Reading it
  // during bootstrap keeps locale selection in the composition root instead of
  // letting a capability package resolve the platform locale itself.
  AgentsSettings? persistedSettings;
  try {
    persistedSettings = await settingsStore.load();
  } catch (_) {
    persistedSettings = null;
  }
  final resolvedLocaleTag = resolveSdkworkAgentsLocaleTag(
    localeTag ?? persistedSettings?.language.tag ?? adapters.localeTag,
  );
  final services = createAgentsMobileServices(
    sdkClients,
    localeTag: resolvedLocaleTag,
    settingsStore: settingsStore,
  );
  final routes = createRoutes();
  return AgentsMobileRuntime(
    sdkClients: sdkClients,
    services: services,
    routes: routes,
    adapters: adapters,
    localeTag: resolvedLocaleTag,
    tabs: routes.tabs,
    themeMode: resolveTechBlueThemeMode(persistedSettings?.theme.wireValue),
  );
}
