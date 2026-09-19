import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/agents_messages.dart';
import '../models/agent_models.dart';
import '../services/agent_catalog_service.dart';
import '../state/agent_catalog_state.dart';

/// Presentation controller for the agents catalog.
///
/// Owns UI state mapping and calls the service only.
class AgentsCatalogController extends ChangeNotifier {
  AgentsCatalogController({
    required this.service,
    AgentsCatalogScope scope = AgentsCatalogScope.mine,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  })  : translate = createAgentsCatalogTranslator(localeTag),
        _state = initialAgentsCatalogState(scope: scope);

  final AgentCatalogService service;
  final String Function(String key) translate;

  AgentsCatalogState _state;

  AgentsCatalogState get state => _state;

  void updateQuery(String query) {
    _state = _state.copyWith(query: query);
    notifyListeners();
  }

  /// Reloads the first page, optionally switching scope.
  Future<void> load({AgentsCatalogScope? scope}) async {
    final nextScope = scope ?? _state.scope;
    _state = _state.copyWith(scope: nextScope, loading: true, errorMessage: '');
    notifyListeners();
    try {
      final result = await service.loadPage(
        page: 1,
        scope: nextScope,
        query: _state.query,
      );
      _state = _state.copyWith(
        items: result.items,
        page: result.page,
        hasMore: result.hasMore,
        loading: false,
        errorMessage: '',
      );
    } catch (_) {
      _state = _state.copyWith(
        items: const <AgentsCatalogItem>[],
        hasMore: false,
        loading: false,
        errorMessage: translate('agents.catalog.loadFailed'),
      );
    }
    notifyListeners();
  }

  /// Appends the next page when the scope has more rows.
  Future<void> loadMore() async {
    if (_state.loading || !_state.hasMore) {
      return;
    }
    _state = _state.copyWith(loading: true);
    notifyListeners();
    try {
      final result = await service.loadPage(
        page: _state.page + 1,
        scope: _state.scope,
        query: _state.query,
      );
      _state = _state.copyWith(
        items: <AgentsCatalogItem>[..._state.items, ...result.items],
        page: result.page,
        hasMore: result.hasMore,
        loading: false,
        errorMessage: '',
      );
    } catch (_) {
      _state = _state.copyWith(
        loading: false,
        errorMessage: translate('agents.catalog.loadFailed'),
      );
    }
    notifyListeners();
  }
}
