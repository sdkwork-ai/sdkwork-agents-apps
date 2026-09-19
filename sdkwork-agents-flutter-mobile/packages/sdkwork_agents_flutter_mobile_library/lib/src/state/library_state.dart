import '../models/library_models.dart';

/// Package-local state slice for the library tab.
///
/// Sensitive state must clear on logout and account/tenant switch.
class AgentsLibraryState {
  const AgentsLibraryState({
    required this.files,
    required this.query,
    required this.loading,
    required this.truncated,
    required this.errorMessage,
  });

  final List<AgentsLibraryFile> files;
  final String query;
  final bool loading;

  /// True when the drain stopped at the page ceiling with more rows remaining.
  final bool truncated;
  final String errorMessage;

  AgentsLibraryState copyWith({
    List<AgentsLibraryFile>? files,
    String? query,
    bool? loading,
    bool? truncated,
    String? errorMessage,
  }) {
    return AgentsLibraryState(
      files: files ?? this.files,
      query: query ?? this.query,
      loading: loading ?? this.loading,
      truncated: truncated ?? this.truncated,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

AgentsLibraryState initialAgentsLibraryState() {
  return const AgentsLibraryState(
    files: <AgentsLibraryFile>[],
    query: '',
    loading: true,
    truncated: false,
    errorMessage: '',
  );
}
