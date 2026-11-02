/// Persisted settings port for the Agents Flutter mobile root.
///
/// The composition root provides the concrete adapter (shared_preferences on
/// Android/iOS), so the profile package stays free of host storage APIs and is
/// testable with an in-memory implementation.
library;

import '../models/settings_models.dart';

abstract class AgentsSettingsStore {
  /// Returns the persisted settings, or null when nothing has been saved yet.
  Future<AgentsSettings?> load();

  Future<void> save(AgentsSettings settings);
}
