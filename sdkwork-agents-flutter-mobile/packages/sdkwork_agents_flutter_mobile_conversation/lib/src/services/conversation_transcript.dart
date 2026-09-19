/// Transcript normalization for the Agents Flutter mobile conversation.
///
/// The Agents app API returns a flat, sequence-ordered stream of session items
/// (`user_input`, `assistant_output`, `reasoning`, `tool_call`, `tool_result`,
/// `status_notice`, ...). Every client root folds that stream into a rendered
/// transcript the same way, so this file is the Flutter projection of the same
/// contract the PC, H5, and mini program roots implement.
///
/// Pure functions only: no transport, no state (`FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md`
/// section 4 — `services/` maps records and interprets pagination).
library;

import '../models/conversation_models.dart';

/// Matches the bounded server context window for one interactive session page.
const int agentsConversationSessionItemPageSize = 50;

/// Epoch-millisecond default used when a record carries no usable timestamp.
int parseAgentsConversationTimestamp(String? value, {int? fallbackMillis}) {
  if (value == null || value.isEmpty) {
    return fallbackMillis ?? DateTime.now().millisecondsSinceEpoch;
  }
  return DateTime.tryParse(value)?.millisecondsSinceEpoch ??
      (fallbackMillis ?? DateTime.now().millisecondsSinceEpoch);
}

/// Compares two int64 cursors as strings without widening them to `num`.
///
/// `API_SPEC.md` section 13.6 keeps int64 on the wire as a decimal string;
/// sequence values can exceed 2^53, so they are compared as `BigInt`.
int compareAgentsConversationInt64(String left, String right) {
  if (left == right) {
    return 0;
  }
  final leftValue = BigInt.tryParse(left);
  final rightValue = BigInt.tryParse(right);
  if (leftValue == null || rightValue == null) {
    return left.compareTo(right);
  }
  return leftValue.compareTo(rightValue);
}

/// Tie-break ordering for records sharing a sequence and timestamp.
int agentsConversationKindOrder(String kind) {
  switch (kind) {
    case 'user_input':
      return 10;
    case 'system_instruction':
    case 'status_notice':
      return 15;
    case 'assistant_output':
    case 'reasoning':
      return 20;
    case 'tool_call':
      return 30;
    case 'tool_result':
      return 40;
    case 'error_notice':
      return 50;
    default:
      return 60;
  }
}

AgentsConversationRole toAgentsConversationRole(String? kind) {
  switch (kind) {
    case 'user_input':
      return AgentsConversationRole.user;
    case 'system_instruction':
    case 'status_notice':
    case 'error_notice':
      return AgentsConversationRole.system;
    case 'tool_call':
    case 'tool_result':
      return AgentsConversationRole.tool;
    default:
      return AgentsConversationRole.assistant;
  }
}

/// Maps one `AgentSessionRecord` payload onto the session view model.
AgentsConversationSession? mapAgentsConversationSession(Map<String, dynamic> record) {
  final id = record['sessionId'];
  if (id is! String || id.isEmpty) {
    return null;
  }
  final title = record['title'];
  final trimmedTitle = title is String ? title.trim() : '';
  return AgentsConversationSession(
    id: id,
    title: trimmedTitle.isEmpty ? 'New chat' : trimmedTitle,
    updatedAtMillis: parseAgentsConversationTimestamp(record['updatedAt']?.toString()),
    version: (record['version'] ?? '0').toString(),
  );
}

/// Mutable fold accumulator for one tool call while the transcript is rebuilt.
class _ToolCallBuilder {
  _ToolCallBuilder({required this.id, this.name});

  final String id;
  String? name;
  String? arguments;
  AgentsConversationToolStatus status = AgentsConversationToolStatus.running;
  String? error;

  AgentsConversationToolCall build() {
    return AgentsConversationToolCall(
      id: id,
      name: name,
      status: status,
      arguments: arguments,
      error: error,
    );
  }
}

/// Folds `reasoning` items and `tool_call`/`tool_result` pairs into the
/// following assistant message, then orders the transcript the way the PC, H5,
/// and mini program roots do (sequence is authoritative).
List<AgentsConversationMessage> normalizeAgentsConversationMessages(
  List<Map<String, dynamic>> records,
) {
  final ordered = List<Map<String, dynamic>>.from(records);
  ordered.sort((Map<String, dynamic> left, Map<String, dynamic> right) {
    final sequenceOrder = compareAgentsConversationInt64(
      (left['sequence'] ?? '0').toString(),
      (right['sequence'] ?? '0').toString(),
    );
    if (sequenceOrder != 0) {
      return sequenceOrder;
    }
    final createdAtOrder = (left['createdAt']?.toString() ?? '')
        .compareTo(right['createdAt']?.toString() ?? '');
    if (createdAtOrder != 0) {
      return createdAtOrder;
    }
    return agentsConversationKindOrder((left['kind'] ?? '').toString()) -
        agentsConversationKindOrder((right['kind'] ?? '').toString());
  });

  final messages = <AgentsConversationMessage>[];
  var pendingReasoning = '';
  final pendingToolCalls = <_ToolCallBuilder>[];
  final toolCallsById = <String, _ToolCallBuilder>{};

  for (final record in ordered) {
    final kind = record['kind']?.toString() ?? '';
    final content = record['content']?.toString();

    if (kind == 'reasoning') {
      pendingReasoning += content ?? '';
      continue;
    }

    if (kind == 'tool_call' || kind == 'tool_result') {
      final toolCallId = record['toolCallId'];
      if (toolCallId is! String || toolCallId.isEmpty) {
        continue;
      }
      var call = toolCallsById[toolCallId];
      if (call == null) {
        call = _ToolCallBuilder(id: toolCallId, name: record['toolName']?.toString());
        toolCallsById[toolCallId] = call;
        pendingToolCalls.add(call);
      }
      if (kind == 'tool_call') {
        if ((call.name ?? '').isEmpty && record['toolName'] != null) {
          call.name = record['toolName'].toString();
        }
        final arguments = record['toolArguments'];
        if (arguments != null) {
          call.arguments = arguments.toString();
        }
        continue;
      }
      final result = record['toolResult'];
      final resultMap = result is Map ? result : const <Object?, Object?>{};
      final resultContent = resultMap['content'];
      if (resultMap['status'] == 'succeeded') {
        call.status = AgentsConversationToolStatus.completed;
      } else {
        call.status = AgentsConversationToolStatus.error;
        call.error = resultContent?.toString() ?? resultMap['status']?.toString();
      }
      continue;
    }

    final itemId = record['itemId'];
    if (itemId is! String || itemId.isEmpty) {
      continue;
    }
    var message = AgentsConversationMessage(
      id: itemId,
      role: toAgentsConversationRole(kind),
      text: content ?? '',
      createdAt: record['createdAt']?.toString(),
    );
    if (message.role == AgentsConversationRole.assistant && pendingReasoning.isNotEmpty) {
      message = message.copyWith(reasoning: pendingReasoning);
      pendingReasoning = '';
    }
    if (message.role == AgentsConversationRole.assistant && pendingToolCalls.isNotEmpty) {
      message = message.copyWith(
        toolCalls: pendingToolCalls
            .map((builder) => builder.build())
            .toList(growable: false),
      );
      pendingToolCalls.clear();
      toolCallsById.clear();
    }
    messages.add(message);
  }

  return messages;
}
