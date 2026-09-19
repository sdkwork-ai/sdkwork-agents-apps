/// Conversation domain models for the Agents Flutter mobile surfaces.
///
/// Semantics follow `AGENTS_DOMAIN_SPEC.md`: a rendered conversation is an
/// `AgentSession`, one exchange is an `AgentTurn`, and each transcript row is an
/// `AgentSessionItem`. UI copy may say "message"; the durable resources keep the
/// Agents vocabulary. The shapes mirror the H5 and mini program roots so every
/// mobile root renders the same transcript.
library;

enum AgentsConversationRole { user, assistant, system, tool }

enum AgentsConversationToolStatus { running, completed, error }

/// One streamed tool/skill/MCP lifecycle phase from the kernel-v1 protocol.
enum AgentsConversationToolPhase { start, delta, stop }

class AgentsConversationToolCall {
  const AgentsConversationToolCall({
    required this.id,
    this.name,
    this.status = AgentsConversationToolStatus.running,
    this.arguments,
    this.error,
  });

  final String id;
  final String? name;
  final AgentsConversationToolStatus status;
  final String? arguments;
  final String? error;

  AgentsConversationToolCall copyWith({
    String? name,
    AgentsConversationToolStatus? status,
    String? arguments,
    String? error,
    bool clearError = false,
  }) {
    return AgentsConversationToolCall(
      id: id,
      name: name ?? this.name,
      status: status ?? this.status,
      arguments: arguments ?? this.arguments,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AgentsConversationMessage {
  const AgentsConversationMessage({
    required this.id,
    required this.role,
    required this.text,
    this.reasoning,
    this.toolCalls = const <AgentsConversationToolCall>[],
    this.createdAt,
    this.streaming = false,
    this.error,
  });

  final String id;
  final AgentsConversationRole role;
  final String text;

  /// Thinking/reasoning text rendered as a collapsible block.
  final String? reasoning;
  final List<AgentsConversationToolCall> toolCalls;
  final String? createdAt;

  /// True while the assistant message is still receiving stream deltas.
  final bool streaming;

  /// Localized failure text when the turn did not complete.
  final String? error;

  bool get isUser => role == AgentsConversationRole.user;

  bool get hasReasoning => (reasoning ?? '').isNotEmpty;

  bool get hasToolCalls => toolCalls.isNotEmpty;

  AgentsConversationMessage copyWith({
    String? id,
    AgentsConversationRole? role,
    String? text,
    String? reasoning,
    List<AgentsConversationToolCall>? toolCalls,
    String? createdAt,
    bool? streaming,
    String? error,
    bool clearError = false,
  }) {
    return AgentsConversationMessage(
      id: id ?? this.id,
      role: role ?? this.role,
      text: text ?? this.text,
      reasoning: reasoning ?? this.reasoning,
      toolCalls: toolCalls ?? this.toolCalls,
      createdAt: createdAt ?? this.createdAt,
      streaming: streaming ?? this.streaming,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AgentsConversationSession {
  const AgentsConversationSession({
    required this.id,
    required this.title,
    required this.updatedAtMillis,
    required this.version,
  });

  final String id;
  final String title;

  /// Epoch milliseconds.
  final int updatedAtMillis;
  final String version;
}

class AgentsConversationMessagePage {
  const AgentsConversationMessagePage({
    required this.items,
    required this.hasMore,
    this.nextCursor,
  });

  final List<AgentsConversationMessage> items;
  final bool hasMore;
  final String? nextCursor;
}

class AgentsConversationTurnResult {
  const AgentsConversationTurnResult({required this.id, required this.content});

  final String id;
  final String content;
}

/// Streamed tool/skill/MCP lifecycle event from the kernel-v1 protocol.
class AgentsConversationToolStreamEvent {
  const AgentsConversationToolStreamEvent({
    required this.phase,
    this.toolCallId,
    this.toolName,
    this.delta,
    this.result,
    this.isError = false,
  });

  final AgentsConversationToolPhase phase;
  final String? toolCallId;
  final String? toolName;
  final String? delta;
  final String? result;
  final bool isError;
}

class AgentsConversationStreamHandlers {
  const AgentsConversationStreamHandlers({
    this.onDelta,
    this.onReasoning,
    this.onToolEvent,
  });

  final void Function(String delta)? onDelta;
  final void Function(String reasoning)? onReasoning;
  final void Function(AgentsConversationToolStreamEvent event)? onToolEvent;
}

class AgentsConversationTurnInput {
  const AgentsConversationTurnInput({
    required this.sessionId,
    required this.content,
    this.model,
    this.systemPrompt,
    this.wireProtocol,
  });

  final String sessionId;
  final String content;
  final String? model;
  final String? systemPrompt;
  final String? wireProtocol;
}
