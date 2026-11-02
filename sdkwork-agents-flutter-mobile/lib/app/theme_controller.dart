import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';

/// Owns the app-wide light/dark/system choice for the composition root.
///
/// The persisted settings store is the source of truth on launch; a selection
/// in the settings form is applied immediately through
/// [setSettingsTheme], then persisted by the settings controller's save.
class AgentsThemeController extends ChangeNotifier {
  AgentsThemeController({
    required AgentsSettingsStore store,
    ThemeMode initialMode = ThemeMode.system,
  }) : _store = store,
       _mode = initialMode;

  final AgentsSettingsStore _store;
  ThemeMode _mode;

  ThemeMode get mode => _mode;

  /// Re-reads the persisted choice, for a host that changed settings outside
  /// the form. Failures keep the current mode.
  Future<void> refresh() async {
    try {
      final persisted = await _store.load();
      if (persisted != null) {
        setSettingsTheme(persisted.theme);
      }
    } catch (_) {
      // Keep the current appearance when storage is unavailable.
    }
  }

  /// Applies a settings choice immediately (live preview while the form is
  /// still unsaved).
  void setSettingsTheme(AgentsSettingsTheme theme) {
    final ThemeMode next = resolveTechBlueThemeMode(theme.wireValue);
    if (next == _mode) {
      return;
    }
    _mode = next;
    notifyListeners();
  }
}

/// Exposes the theme controller to the settings route.
class AgentsThemeScope extends InheritedNotifier<AgentsThemeController> {
  const AgentsThemeScope({
    required AgentsThemeController controller,
    required super.child,
    super.key,
  }) : super(notifier: controller);

  static AgentsThemeController of(BuildContext context) {
    final AgentsThemeScope? scope = context
        .dependOnInheritedWidgetOfExactType<AgentsThemeScope>();
    if (scope == null) {
      throw StateError('AgentsThemeScope is not available.');
    }
    return scope.notifier!;
  }
}
