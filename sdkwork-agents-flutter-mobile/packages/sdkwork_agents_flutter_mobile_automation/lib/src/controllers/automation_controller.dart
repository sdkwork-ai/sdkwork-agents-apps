import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/automation_messages.dart';
import '../models/automation_models.dart';
import '../services/automation_service.dart';
import '../state/automation_state.dart';

/// Presentation controller for the automation tab.
class AgentsAutomationController extends ChangeNotifier {
  AgentsAutomationController({
    required this.service,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  }) : translate = createAgentsAutomationTranslator(localeTag);

  final AgentsAutomationService service;
  final String Function(String key) translate;

  AgentsAutomationState _state = initialAgentsAutomationState();

  AgentsAutomationState get state => _state;

  /// Tasks matching the active search query.
  List<AgentsTaskSummary> get visibleTasks =>
      filterAgentsTasks(_state.tasks, _state.query);

  /// Localized status label for a raw server status, or the raw value.
  String statusLabel(String? status) {
    final key = resolveAgentsTaskStatusKey(status);
    return key == null ? (status ?? '') : translate(key);
  }

  void updateQuery(String query) {
    _state = _state.copyWith(query: query);
    notifyListeners();
  }

  /// Refreshes the tab. [force] drops the memoized aggregation first, which is
  /// what a pull-to-refresh must do.
  Future<void> load({bool force = false}) async {
    if (force) {
      service.resetCache();
    }
    _state = _state.copyWith(loading: true, errorMessage: '');
    notifyListeners();
    try {
      final listing = await service.loadTasks();
      _state = _state.copyWith(
        tasks: listing.items,
        truncated: listing.truncated,
        loading: false,
        errorMessage: '',
      );
    } catch (_) {
      _state = _state.copyWith(
        tasks: const <AgentsTaskSummary>[],
        truncated: false,
        loading: false,
        errorMessage: translate('agents.automation.loadFailed'),
      );
    }
    notifyListeners();
  }
}
