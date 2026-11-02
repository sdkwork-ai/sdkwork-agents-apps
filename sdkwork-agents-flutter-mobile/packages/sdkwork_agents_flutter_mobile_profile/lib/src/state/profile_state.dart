import '../models/profile_models.dart';

/// Package-local state slice for the profile hub.
class AgentsProfileState {
  const AgentsProfileState({
    required this.identity,
    required this.usage,
    required this.loading,
    required this.errorMessage,
  });

  final AgentsProfileIdentity? identity;
  final AgentsProfileUsage? usage;
  final bool loading;
  final String errorMessage;

  AgentsProfileState copyWith({
    AgentsProfileIdentity? identity,
    AgentsProfileUsage? usage,
    bool clearUsage = false,
    bool? loading,
    String? errorMessage,
  }) {
    return AgentsProfileState(
      identity: identity ?? this.identity,
      usage: clearUsage ? null : (usage ?? this.usage),
      loading: loading ?? this.loading,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

AgentsProfileState initialAgentsProfileState() {
  return const AgentsProfileState(
    identity: null,
    usage: null,
    loading: true,
    errorMessage: '',
  );
}
