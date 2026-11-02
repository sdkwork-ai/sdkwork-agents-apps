import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/profile_messages.dart';
import '../models/settings_models.dart';
import '../services/settings_store.dart';
import '../state/settings_state.dart';

/// Presentation controller for the settings form.
///
/// The form edits a draft; [save] persists it through the injected store and
/// re-reads it, so the "saved" state reflects what was actually persisted.
class AgentsSettingsController extends ChangeNotifier {
  AgentsSettingsController({
    required this.store,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  })  : translate = createAgentsProfileTranslator(localeTag),
        _defaults = AgentsSettings.defaults(localeTag) {
    _state = AgentsSettingsState(
      settings: _defaults,
      loading: true,
      saving: false,
      saved: false,
      errorMessage: '',
    );
  }

  final AgentsSettingsStore store;
  final String Function(String key) translate;
  final AgentsSettings _defaults;

  late AgentsSettingsState _state;

  AgentsSettingsState get state => _state;

  String get retryLabel => translate('agents.settings.retry');

  Future<void> load() async {
    _state = _state.copyWith(loading: true, saved: false, errorMessage: '');
    notifyListeners();
    try {
      final persisted = await store.load();
      _state = _state.copyWith(
        settings: persisted ?? _defaults,
        loading: false,
        saved: false,
        errorMessage: '',
      );
    } catch (_) {
      _state = _state.copyWith(
        settings: _defaults,
        loading: false,
        saved: false,
        errorMessage: translate('agents.settings.loadFailed'),
      );
    }
    notifyListeners();
  }

  void updateLanguage(AgentsSettingsLanguage language) {
    _state = _state.copyWith(
      settings: _state.settings.copyWith(language: language),
      saved: false,
      errorMessage: '',
    );
    notifyListeners();
  }

  void updateTheme(AgentsSettingsTheme theme) {
    _state = _state.copyWith(
      settings: _state.settings.copyWith(theme: theme),
      saved: false,
      errorMessage: '',
    );
    notifyListeners();
  }

  void updateNotifications(bool enabled) {
    _state = _state.copyWith(
      settings: _state.settings.copyWith(notificationsEnabled: enabled),
      saved: false,
      errorMessage: '',
    );
    notifyListeners();
  }

  void updateAutoplay(bool enabled) {
    _state = _state.copyWith(
      settings: _state.settings.copyWith(autoplayEnabled: enabled),
      saved: false,
      errorMessage: '',
    );
    notifyListeners();
  }

  Future<void> save() async {
    if (_state.saving || _state.loading) {
      return;
    }
    _state = _state.copyWith(saving: true, saved: false, errorMessage: '');
    notifyListeners();
    try {
      await store.save(_state.settings);
      final persisted = await store.load();
      _state = _state.copyWith(
        settings: persisted ?? _state.settings,
        saving: false,
        saved: true,
        errorMessage: '',
      );
    } catch (_) {
      _state = _state.copyWith(
        saving: false,
        saved: false,
        errorMessage: translate('agents.settings.saveFailed'),
      );
    }
    notifyListeners();
  }
}
