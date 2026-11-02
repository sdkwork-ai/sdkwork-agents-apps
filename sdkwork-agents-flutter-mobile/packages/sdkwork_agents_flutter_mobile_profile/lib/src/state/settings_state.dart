import '../models/settings_models.dart';

/// Package-local state slice for the settings form.
class AgentsSettingsState {
  const AgentsSettingsState({
    required this.settings,
    required this.loading,
    required this.saving,
    required this.saved,
    required this.errorMessage,
  });

  final AgentsSettings settings;
  final bool loading;
  final bool saving;

  /// True after a successful persist until the next edit.
  final bool saved;
  final String errorMessage;

  AgentsSettingsState copyWith({
    AgentsSettings? settings,
    bool? loading,
    bool? saving,
    bool? saved,
    String? errorMessage,
  }) {
    return AgentsSettingsState(
      settings: settings ?? this.settings,
      loading: loading ?? this.loading,
      saving: saving ?? this.saving,
      saved: saved ?? this.saved,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}
