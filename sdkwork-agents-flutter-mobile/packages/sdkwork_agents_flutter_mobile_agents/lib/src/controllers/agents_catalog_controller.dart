import 'package:flutter/foundation.dart';

import '../models/agent_models.dart';
import '../services/agent_catalog_service.dart';
import '../state/agent_catalog_state.dart';

/// Presentation controller for the agents catalog.
///
/// Owns UI state mapping and calls services only.
class AgentsCatalogController extends ChangeNotifier {
  AgentsCatalogController({required this.service});

  final AgentCatalogService service;
  AgentsCatalogState _state = initialAgentsCatalogState();

  AgentsCatalogState get state => _state;

  Future<void> load({int page = 1}) async {
    _state = _state.copyWith(loading: true, errorMessage: '');
    notifyListeners();
    try {
      final result = await service.loadPage(page: page);
      _state = _state.copyWith(
        items: result.items,
        page: result.page,
        hasMore: result.hasMore,
        loading: false,
        errorMessage: '',
      );
    } catch (error) {
      _state = _state.copyWith(
        items: const <AgentsCatalogItem>[],
        loading: false,
        errorMessage: error.toString(),
      );
    }
    notifyListeners();
  }
}
