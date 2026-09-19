import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/projects_messages.dart';
import '../models/projects_models.dart';
import '../services/projects_service.dart';
import '../state/projects_state.dart';

/// Presentation controller for the projects tab.
class AgentsProjectsController extends ChangeNotifier {
  AgentsProjectsController({
    required this.service,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  }) : translate = createAgentsProjectsTranslator(localeTag);

  final AgentsProjectsService service;
  final String Function(String key) translate;

  AgentsProjectsState _state = initialAgentsProjectsState();

  AgentsProjectsState get state => _state;

  /// Projects matching the active search query.
  List<AgentsProjectSummary> get visibleProjects =>
      filterAgentsProjects(_state.projects, _state.query);

  void updateQuery(String query) {
    _state = _state.copyWith(query: query);
    notifyListeners();
  }

  Future<void> load() async {
    _state = _state.copyWith(loading: true, errorMessage: '');
    notifyListeners();
    try {
      final listing = await service.loadProjects();
      _state = _state.copyWith(
        projects: listing.items,
        truncated: listing.truncated,
        loading: false,
        errorMessage: '',
      );
    } catch (_) {
      _state = _state.copyWith(
        projects: const <AgentsProjectSummary>[],
        truncated: false,
        loading: false,
        errorMessage: translate('agents.projects.loadFailed'),
      );
    }
    notifyListeners();
  }
}
