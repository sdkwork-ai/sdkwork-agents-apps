import '../models/agent_models.dart';

/// Package-local state slice for the agents catalog.
///
/// Sensitive state must clear on logout and account/tenant switch.
class AgentsCatalogState {
  const AgentsCatalogState({
    required this.page,
    required this.items,
    required this.hasMore,
    required this.loading,
    required this.errorMessage,
  });

  final int page;
  final List<AgentsCatalogItem> items;
  final bool hasMore;
  final bool loading;
  final String errorMessage;

  AgentsCatalogState copyWith({
    int? page,
    List<AgentsCatalogItem>? items,
    bool? hasMore,
    bool? loading,
    String? errorMessage,
  }) {
    return AgentsCatalogState(
      page: page ?? this.page,
      items: items ?? this.items,
      hasMore: hasMore ?? this.hasMore,
      loading: loading ?? this.loading,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

AgentsCatalogState initialAgentsCatalogState() {
  return const AgentsCatalogState(
    page: 1,
    items: <AgentsCatalogItem>[],
    hasMore: false,
    loading: true,
    errorMessage: '',
  );
}
