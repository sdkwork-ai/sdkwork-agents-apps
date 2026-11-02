import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';

void main() {
  test('settings load defaults, persist edits, and read them back', () async {
    final store = _InMemorySettingsStore();
    final controller = AgentsSettingsController(
      store: store,
      localeTag: 'en-US',
    );
    await controller.load();
    expect(controller.state.loading, isFalse);
    expect(controller.state.settings.language, AgentsSettingsLanguage.enUs);
    expect(controller.state.settings.theme, AgentsSettingsTheme.system);

    controller.updateLanguage(AgentsSettingsLanguage.zhCn);
    controller.updateTheme(AgentsSettingsTheme.dark);
    controller.updateNotifications(false);
    controller.updateAutoplay(false);
    await controller.save();

    expect(controller.state.saved, isTrue);
    expect(controller.state.saving, isFalse);
    expect(store.saved, isNotNull);

    final reloaded = AgentsSettingsController(store: store, localeTag: 'en-US');
    await reloaded.load();
    expect(reloaded.state.settings.language, AgentsSettingsLanguage.zhCn);
    expect(reloaded.state.settings.theme, AgentsSettingsTheme.dark);
    expect(reloaded.state.settings.notificationsEnabled, isFalse);
    expect(reloaded.state.settings.autoplayEnabled, isFalse);
  });

  test('settings store failure surfaces localized error copy', () async {
    final controller = AgentsSettingsController(
      store: _FailingSettingsStore(),
      localeTag: 'en-US',
    );
    await controller.load();
    expect(
      controller.state.errorMessage,
      'Failed to load settings. Please retry.',
    );
    await controller.save();
    expect(controller.state.saved, isFalse);
    expect(
      controller.state.errorMessage,
      'Failed to save settings. Please retry.',
    );
  });
}

class _InMemorySettingsStore implements AgentsSettingsStore {
  AgentsSettings? saved;

  @override
  Future<AgentsSettings?> load() async => saved;

  @override
  Future<void> save(AgentsSettings settings) async {
    saved = settings;
  }
}

class _FailingSettingsStore implements AgentsSettingsStore {
  @override
  Future<AgentsSettings?> load() async {
    throw StateError('storage unavailable');
  }

  @override
  Future<void> save(AgentsSettings settings) async {
    throw StateError('storage unavailable');
  }
}
