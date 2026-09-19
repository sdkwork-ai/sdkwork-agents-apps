import '../models/projects_models.dart';

/// Package-local state slice for the projects tab.
///
/// Sensitive state must clear on logout and account/tenant switch.
class AgentsProjectsState {
  const AgentsProjectsState({
    required this.projects,
    required this.query,
    required this.loading,
    required this.truncated,
    required this.errorMessage,
  });

  final List<AgentsProjectSummary> projects;
  final String query;
  final bool loading;

  /// True when the drain stopped at the page ceiling with more rows remaining.
  final bool truncated;
  final String errorMessage;

  AgentsProjectsState copyWith({
    List<AgentsProjectSummary>? projects,
    String? query,
    bool? loading,
    bool? truncated,
    String? errorMessage,
  }) {
    return AgentsProjectsState(
      projects: projects ?? this.projects,
      query: query ?? this.query,
      loading: loading ?? this.loading,
      truncated: truncated ?? this.truncated,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

AgentsProjectsState initialAgentsProjectsState() {
  return const AgentsProjectsState(
    projects: <AgentsProjectSummary>[],
    query: '',
    loading: true,
    truncated: false,
    errorMessage: '',
  );
}
