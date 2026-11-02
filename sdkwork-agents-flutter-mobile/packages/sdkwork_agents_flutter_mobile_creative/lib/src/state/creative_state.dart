import '../models/creative_models.dart';

/// Package-local state slice for the creative studio.
class AgentsCreativeState {
  const AgentsCreativeState({
    required this.prompt,
    required this.modality,
    required this.aspectRatio,
    required this.sessions,
    required this.activeSession,
    required this.loadingSessions,
    required this.submitting,
    required this.unavailable,
    required this.errorMessage,
  });

  final String prompt;
  final AgentsCreativeModality modality;
  final AgentsCreativeAspectRatio aspectRatio;
  final List<AgentsCreativeSessionSummary> sessions;
  final AgentsCreativeSession? activeSession;
  final bool loadingSessions;
  final bool submitting;

  /// True when the injected source reported that this client has no transport.
  final bool unavailable;
  final String errorMessage;

  List<AgentsCreativeResult> get results =>
      activeSession?.results ?? const <AgentsCreativeResult>[];

  bool get canSubmit => !submitting && prompt.trim().isNotEmpty && !unavailable;

  AgentsCreativeState copyWith({
    String? prompt,
    AgentsCreativeModality? modality,
    AgentsCreativeAspectRatio? aspectRatio,
    List<AgentsCreativeSessionSummary>? sessions,
    AgentsCreativeSession? activeSession,
    bool? loadingSessions,
    bool? submitting,
    bool? unavailable,
    String? errorMessage,
  }) {
    return AgentsCreativeState(
      prompt: prompt ?? this.prompt,
      modality: modality ?? this.modality,
      aspectRatio: aspectRatio ?? this.aspectRatio,
      sessions: sessions ?? this.sessions,
      activeSession: activeSession ?? this.activeSession,
      loadingSessions: loadingSessions ?? this.loadingSessions,
      submitting: submitting ?? this.submitting,
      unavailable: unavailable ?? this.unavailable,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

AgentsCreativeState initialAgentsCreativeState() {
  return const AgentsCreativeState(
    prompt: '',
    modality: AgentsCreativeModality.image,
    aspectRatio: AgentsCreativeAspectRatio.square,
    sessions: <AgentsCreativeSessionSummary>[],
    activeSession: null,
    loadingSessions: true,
    submitting: false,
    unavailable: false,
    errorMessage: '',
  );
}
