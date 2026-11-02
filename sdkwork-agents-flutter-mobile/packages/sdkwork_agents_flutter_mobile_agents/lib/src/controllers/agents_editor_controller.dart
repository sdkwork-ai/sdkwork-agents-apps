import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/agents_messages.dart';
import '../models/agent_models.dart';
import '../services/agent_catalog_service.dart';
import '../state/agent_editor_state.dart';

class AgentsEditorController extends ChangeNotifier {
  AgentsEditorController({
    required this.service,
    this.initialItem,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  })  : translate = createAgentsCatalogTranslator(localeTag),
        _state = initialAgentsEditorState(initialItem);

  final AgentCatalogService service;
  final AgentsCatalogItem? initialItem;
  final String Function(String key) translate;

  AgentsEditorState _state;

  AgentsEditorState get state => _state;

  Future<void> load() async {
    final item = initialItem;
    if (item == null) {
      _state = _state.copyWith(
        loading: false,
        missing: true,
        errorMessage: translate('agents.editor.missing'),
      );
      notifyListeners();
      return;
    }
    _state = _state.copyWith(loading: true, errorMessage: '', missing: false);
    notifyListeners();
    try {
      final loaded = await service.loadAgent(item.id);
      if (loaded == null) {
        _state = _state.copyWith(
          loading: false,
          missing: true,
          errorMessage: translate('agents.editor.missing'),
        );
      } else {
        _state = _state.copyWith(
          item: loaded,
          name: loaded.name,
          description: loaded.description,
          loading: false,
          missing: false,
          errorMessage: '',
        );
      }
    } catch (_) {
      _state = _state.copyWith(
        loading: false,
        errorMessage: translate('agents.editor.loadFailed'),
      );
    }
    notifyListeners();
  }

  void updateName(String value) {
    _state = _state.copyWith(name: value, saved: false);
    notifyListeners();
  }

  void updateDescription(String value) {
    _state = _state.copyWith(description: value, saved: false);
    notifyListeners();
  }

  Future<void> save() async {
    final item = _state.item;
    final name = _state.name.trim();
    if (item == null) {
      return;
    }
    if (name.isEmpty) {
      _state = _state.copyWith(
        errorMessage: translate('agents.editor.nameRequired'),
        saved: false,
      );
      notifyListeners();
      return;
    }
    _state = _state.copyWith(saving: true, errorMessage: '', saved: false);
    notifyListeners();
    try {
      await service.updateAgent(
        agentId: item.id,
        name: name,
        description: _state.description.trim(),
      );
      _state = _state.copyWith(saving: false, saved: true);
    } catch (_) {
      _state = _state.copyWith(
        saving: false,
        errorMessage: translate('agents.editor.loadFailed'),
      );
    }
    notifyListeners();
  }
}
