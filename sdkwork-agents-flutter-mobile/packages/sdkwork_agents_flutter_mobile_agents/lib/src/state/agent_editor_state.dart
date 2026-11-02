import '../models/agent_models.dart';

class AgentsEditorState {
  const AgentsEditorState({
    required this.item,
    required this.name,
    required this.description,
    required this.loading,
    required this.saving,
    required this.saved,
    required this.missing,
    required this.errorMessage,
  });

  final AgentsCatalogItem? item;
  final String name;
  final String description;
  final bool loading;
  final bool saving;
  final bool saved;
  final bool missing;
  final String errorMessage;

  AgentsEditorState copyWith({
    AgentsCatalogItem? item,
    bool clearItem = false,
    String? name,
    String? description,
    bool? loading,
    bool? saving,
    bool? saved,
    bool? missing,
    String? errorMessage,
  }) {
    return AgentsEditorState(
      item: clearItem ? null : (item ?? this.item),
      name: name ?? this.name,
      description: description ?? this.description,
      loading: loading ?? this.loading,
      saving: saving ?? this.saving,
      saved: saved ?? this.saved,
      missing: missing ?? this.missing,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

AgentsEditorState initialAgentsEditorState(AgentsCatalogItem? item) {
  return AgentsEditorState(
    item: item,
    name: item?.name ?? '',
    description: item?.description ?? '',
    loading: item == null,
    saving: false,
    saved: false,
    missing: false,
    errorMessage: '',
  );
}
