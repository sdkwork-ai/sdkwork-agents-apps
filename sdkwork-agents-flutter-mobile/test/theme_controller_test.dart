import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_agents_flutter_mobile/app/theme_controller.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';

class _FakeSettingsStore implements AgentsSettingsStore {
  _FakeSettingsStore(this.persisted);

  AgentsSettings? persisted;
  int loads = 0;

  @override
  Future<AgentsSettings?> load() async {
    loads += 1;
    return persisted;
  }

  @override
  Future<void> save(AgentsSettings settings) async {
    persisted = settings;
  }
}

AgentsSettings _settingsWith(AgentsSettingsTheme theme) {
  return AgentsSettings(
    language: AgentsSettingsLanguage.zhCn,
    theme: theme,
    notificationsEnabled: true,
    autoplayEnabled: true,
  );
}

void main() {
  test('maps the three persisted choices onto ThemeMode', () {
    final _FakeSettingsStore store = _FakeSettingsStore(null);
    final AgentsThemeController controller = AgentsThemeController(
      store: store,
    );
    expect(controller.mode, ThemeMode.system);

    controller.setSettingsTheme(AgentsSettingsTheme.dark);
    expect(controller.mode, ThemeMode.dark);

    controller.setSettingsTheme(AgentsSettingsTheme.light);
    expect(controller.mode, ThemeMode.light);

    controller.setSettingsTheme(AgentsSettingsTheme.system);
    expect(controller.mode, ThemeMode.system);
  });

  test('notifies only when the resolved mode changes', () {
    final _FakeSettingsStore store = _FakeSettingsStore(null);
    final AgentsThemeController controller = AgentsThemeController(
      store: store,
    );
    int notifications = 0;
    controller.addListener(() => notifications += 1);

    controller.setSettingsTheme(AgentsSettingsTheme.system);
    expect(notifications, 0);

    controller.setSettingsTheme(AgentsSettingsTheme.dark);
    expect(notifications, 1);

    controller.setSettingsTheme(AgentsSettingsTheme.dark);
    expect(notifications, 1);
  });

  test('refresh loads the persisted appearance', () async {
    final _FakeSettingsStore store = _FakeSettingsStore(
      _settingsWith(AgentsSettingsTheme.dark),
    );
    final AgentsThemeController controller = AgentsThemeController(
      store: store,
    );

    await controller.refresh();

    expect(store.loads, 1);
    expect(controller.mode, ThemeMode.dark);
  });

  test('storage failures keep the current appearance', () async {
    final AgentsThemeController controller = AgentsThemeController(
      store: _ThrowingSettingsStore(),
      initialMode: ThemeMode.light,
    );

    await controller.refresh();

    expect(controller.mode, ThemeMode.light);
  });

  test('unknown wire values fall back to system', () {
    expect(resolveTechBlueThemeMode('sepia'), ThemeMode.system);
    expect(resolveTechBlueThemeMode(null), ThemeMode.system);
    expect(resolveTechBlueThemeMode('dark'), ThemeMode.dark);
    expect(resolveTechBlueThemeMode('light'), ThemeMode.light);
  });
}

class _ThrowingSettingsStore implements AgentsSettingsStore {
  @override
  Future<AgentsSettings?> load() async {
    throw StateError('storage unavailable');
  }

  @override
  Future<void> save(AgentsSettings settings) async {
    throw StateError('storage unavailable');
  }
}
