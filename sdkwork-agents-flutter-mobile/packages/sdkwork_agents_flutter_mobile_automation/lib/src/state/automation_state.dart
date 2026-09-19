import '../models/automation_models.dart';

/// Package-local state slice for the automation tab.
///
/// Sensitive state must clear on logout and account/tenant switch.
class AgentsAutomationState {
  const AgentsAutomationState({
    required this.tasks,
    required this.query,
    required this.loading,
    required this.truncated,
    required this.errorMessage,
  });

  final List<AgentsTaskSummary> tasks;
  final String query;
  final bool loading;

  /// True when the drain stopped at the page ceiling with more rows remaining.
  final bool truncated;
  final String errorMessage;

  AgentsAutomationState copyWith({
    List<AgentsTaskSummary>? tasks,
    String? query,
    bool? loading,
    bool? truncated,
    String? errorMessage,
  }) {
    return AgentsAutomationState(
      tasks: tasks ?? this.tasks,
      query: query ?? this.query,
      loading: loading ?? this.loading,
      truncated: truncated ?? this.truncated,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

AgentsAutomationState initialAgentsAutomationState() {
  return const AgentsAutomationState(
    tasks: <AgentsTaskSummary>[],
    query: '',
    loading: true,
    truncated: false,
    errorMessage: '',
  );
}
