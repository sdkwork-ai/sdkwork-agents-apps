import '../models/conversation_models.dart';

/// Package-local state slice for the conversation surface.
///
/// Sensitive state must clear on logout and account/tenant switch.
class AgentsConversationState {
  const AgentsConversationState({
    required this.messages,
    required this.sessions,
    required this.activeSessionId,
    required this.activeSessionTitle,
    required this.loadingSessions,
    required this.loadingMessages,
    required this.streaming,
    required this.errorMessage,
    required this.draft,
  });

  final List<AgentsConversationMessage> messages;
  final List<AgentsConversationSession> sessions;

  /// Session the composer posts into; `null` until the first turn is sent.
  final String? activeSessionId;
  final String activeSessionTitle;

  final bool loadingSessions;
  final bool loadingMessages;
  final bool streaming;
  final String errorMessage;
  final String draft;

  bool get hasMessages => messages.isNotEmpty;

  AgentsConversationState copyWith({
    List<AgentsConversationMessage>? messages,
    List<AgentsConversationSession>? sessions,
    String? activeSessionId,
    bool clearActiveSession = false,
    String? activeSessionTitle,
    bool? loadingSessions,
    bool? loadingMessages,
    bool? streaming,
    String? errorMessage,
    String? draft,
  }) {
    return AgentsConversationState(
      messages: messages ?? this.messages,
      sessions: sessions ?? this.sessions,
      activeSessionId: clearActiveSession ? null : (activeSessionId ?? this.activeSessionId),
      activeSessionTitle: activeSessionTitle ?? this.activeSessionTitle,
      loadingSessions: loadingSessions ?? this.loadingSessions,
      loadingMessages: loadingMessages ?? this.loadingMessages,
      streaming: streaming ?? this.streaming,
      errorMessage: errorMessage ?? this.errorMessage,
      draft: draft ?? this.draft,
    );
  }
}

AgentsConversationState initialAgentsConversationState() {
  return const AgentsConversationState(
    messages: <AgentsConversationMessage>[],
    sessions: <AgentsConversationSession>[],
    activeSessionId: null,
    activeSessionTitle: '',
    loadingSessions: false,
    loadingMessages: false,
    streaming: false,
    errorMessage: '',
    draft: '',
  );
}
