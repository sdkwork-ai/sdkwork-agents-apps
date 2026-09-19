import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/conversation_messages.dart';
import '../models/conversation_models.dart';
import '../services/conversation_service.dart';
import '../state/conversation_state.dart';

/// Presentation controller for the conversation surface.
///
/// Owns UI state mapping and calls the service only; it never touches transport
/// and never creates agent records (`FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md`
/// section 4 — `controllers/`).
class AgentsConversationController extends ChangeNotifier {
  AgentsConversationController({
    required this.service,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  }) : translate = createAgentsConversationTranslator(localeTag);

  final AgentsConversationService service;

  /// Resolves a copy key for the active locale.
  final String Function(String key) translate;

  AgentsConversationState _state = initialAgentsConversationState();
  int _localMessageSeq = 0;

  AgentsConversationState get state => _state;

  /// Id of the placeholder assistant row while a turn is streaming.
  static const String streamingMessageId = '__streaming__';

  void updateDraft(String value) {
    _state = _state.copyWith(draft: value);
    notifyListeners();
  }

  Future<void> loadSessions() async {
    _state = _state.copyWith(loadingSessions: true, errorMessage: '');
    notifyListeners();
    try {
      final sessions = await service.listSessions();
      _state = _state.copyWith(sessions: sessions, loadingSessions: false, errorMessage: '');
    } catch (_) {
      _state = _state.copyWith(
        loadingSessions: false,
        errorMessage: translate('agents.conversation.error.loadSessions'),
      );
    }
    notifyListeners();
  }

  /// Opens a blank transcript; the session record is created on first send.
  void startNewSession() {
    _state = _state.copyWith(
      messages: const <AgentsConversationMessage>[],
      clearActiveSession: true,
      activeSessionTitle: '',
      errorMessage: '',
      draft: '',
    );
    notifyListeners();
  }

  Future<void> openSession(AgentsConversationSession session) async {
    _state = _state.copyWith(
      activeSessionId: session.id,
      activeSessionTitle: session.title,
      loadingMessages: true,
      errorMessage: '',
    );
    notifyListeners();
    try {
      final page = await service.listMessages(session.id);
      _state = _state.copyWith(
        messages: page.items,
        loadingMessages: false,
        errorMessage: '',
      );
    } catch (_) {
      _state = _state.copyWith(
        messages: const <AgentsConversationMessage>[],
        loadingMessages: false,
        errorMessage: translate('agents.conversation.error.loadMessages'),
      );
    }
    notifyListeners();
  }

  Future<void> renameSession(String sessionId, String title) async {
    final normalized = title.trim();
    if (normalized.isEmpty) {
      return;
    }
    try {
      await service.renameSession(sessionId, normalized);
    } catch (_) {
      _state = _state.copyWith(
        errorMessage: translate('agents.conversation.error.loadSessions'),
      );
      notifyListeners();
      return;
    }
    if (_state.activeSessionId == sessionId) {
      _state = _state.copyWith(activeSessionTitle: normalized);
    }
    await loadSessions();
  }

  Future<void> deleteSession(String sessionId) async {
    try {
      await service.deleteSession(sessionId);
    } catch (_) {
      _state = _state.copyWith(
        errorMessage: translate('agents.conversation.error.loadSessions'),
      );
      notifyListeners();
      return;
    }
    if (_state.activeSessionId == sessionId) {
      startNewSession();
    }
    await loadSessions();
  }

  /// Streams one turn, appending the user row and a live assistant row.
  Future<void> sendTurn(String content) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty || _state.streaming) {
      return;
    }

    String? sessionId = _state.activeSessionId;
    if (sessionId == null) {
      try {
        final created = await service.createSession(_sessionTitleFor(trimmed));
        sessionId = created.id;
        _state = _state.copyWith(activeSessionId: created.id, activeSessionTitle: created.title);
      } catch (_) {
        _state = _state.copyWith(errorMessage: translate('agents.conversation.error.send'));
        notifyListeners();
        return;
      }
    }

    final userMessage = AgentsConversationMessage(
      id: 'local-user-${_localMessageSeq += 1}',
      role: AgentsConversationRole.user,
      text: trimmed,
    );
    final placeholder = AgentsConversationMessage(
      id: streamingMessageId,
      role: AgentsConversationRole.assistant,
      text: '',
      streaming: true,
    );
    _state = _state.copyWith(
      messages: <AgentsConversationMessage>[..._state.messages, userMessage, placeholder],
      streaming: true,
      draft: '',
      errorMessage: '',
    );
    notifyListeners();

    try {
      final result = await service.streamTurn(
        AgentsConversationTurnInput(sessionId: sessionId, content: trimmed),
        AgentsConversationStreamHandlers(
          onDelta: _appendAssistantDelta,
          onReasoning: _appendAssistantReasoning,
          onToolEvent: _applyToolEvent,
        ),
      );
      _replaceStreamingMessage(
        _streamingMessage().copyWith(
          text: result.content.isEmpty ? _streamingMessage().text : result.content,
          streaming: false,
          clearError: true,
        ),
      );
    } catch (_) {
      _replaceStreamingMessage(
        _streamingMessage().copyWith(
          streaming: false,
          error: translate('agents.conversation.error.send'),
        ),
      );
    }

    _state = _state.copyWith(streaming: false);
    notifyListeners();
    // Refresh the list so the generated title and updatedAt ordering catch up.
    await loadSessions();
  }

  String _sessionTitleFor(String content) {
    final firstLine = content.split('\n').first.trim();
    return firstLine.length <= 40 ? firstLine : '${firstLine.substring(0, 40)}…';
  }

  AgentsConversationMessage _streamingMessage() {
    for (final message in _state.messages) {
      if (message.id == streamingMessageId) {
        return message;
      }
    }
    return const AgentsConversationMessage(
      id: streamingMessageId,
      role: AgentsConversationRole.assistant,
      text: '',
    );
  }

  void _replaceStreamingMessage(AgentsConversationMessage replacement) {
    _state = _state.copyWith(
      messages: <AgentsConversationMessage>[
        for (final message in _state.messages)
          if (message.id == streamingMessageId) replacement else message,
      ],
    );
    notifyListeners();
  }

  void _appendAssistantDelta(String delta) {
    final current = _streamingMessage();
    _replaceStreamingMessage(current.copyWith(text: '${current.text}$delta'));
  }

  void _appendAssistantReasoning(String reasoning) {
    final current = _streamingMessage();
    _replaceStreamingMessage(
      current.copyWith(reasoning: '${current.reasoning ?? ''}$reasoning'),
    );
  }

  void _applyToolEvent(AgentsConversationToolStreamEvent event) {
    final toolCallId = event.toolCallId;
    if (toolCallId == null || toolCallId.isEmpty) {
      return;
    }
    final current = _streamingMessage();
    final calls = <AgentsConversationToolCall>[...current.toolCalls];
    var index = calls.indexWhere((call) => call.id == toolCallId);
    if (index < 0) {
      calls.add(
        AgentsConversationToolCall(
          id: toolCallId,
          name: event.toolName,
          status: AgentsConversationToolStatus.running,
        ),
      );
      index = calls.length - 1;
    }
    final existing = calls[index];
    switch (event.phase) {
      case AgentsConversationToolPhase.start:
        calls[index] = existing.copyWith(
          name: event.toolName ?? existing.name,
          status: AgentsConversationToolStatus.running,
        );
      case AgentsConversationToolPhase.delta:
        calls[index] = existing.copyWith(
          status: AgentsConversationToolStatus.running,
        );
      case AgentsConversationToolPhase.stop:
        calls[index] = existing.copyWith(
          name: event.toolName ?? existing.name,
          status: event.isError
              ? AgentsConversationToolStatus.error
              : AgentsConversationToolStatus.completed,
          error: event.isError ? (event.result ?? existing.error) : existing.error,
        );
    }
    _replaceStreamingMessage(
      current.copyWith(toolCalls: calls, streaming: true),
    );
  }
}
