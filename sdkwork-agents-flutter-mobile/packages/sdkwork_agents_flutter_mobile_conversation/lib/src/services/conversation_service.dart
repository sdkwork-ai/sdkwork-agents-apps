/// Conversation orchestration for the Agents Flutter mobile root.
///
/// Mirrors the PC, H5, and mini program conversation contracts so every client
/// root exposes the same session management and streaming behavior. The SDK
/// client and the agent provisioning port are injected by the composition root;
/// this service never constructs transport and never creates agent records
/// itself (`FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` section 4,
/// `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 5).
///
/// Streaming: the generated Dart SDK exposes the turn operation as a native
/// `Stream<AgentTurnStreamEvent>` (`AiApi.agentsTurnsStream`), so the SSE
/// frames the TypeScript roots parse by hand arrive here already typed. The
/// frame *semantics* — `delta` for visible text, `event` for reasoning and
/// tool/skill/MCP lifecycle, `completion` for the terminal envelope — are
/// identical to `@sdkwork/agents-app-sdk`'s `completeAgentTurnStream`.
library;

import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:sdkwork_agents_app_sdk/sdkwork_agents_app_sdk.dart';
import 'package:sdkwork_agents_flutter_mobile_core/sdkwork_agents_flutter_mobile_core.dart';
import 'package:sdkwork_common_flutter/sdkwork_common_flutter.dart';

import '../models/conversation_models.dart';
import 'conversation_transcript.dart';

/// Agent id of the built-in conversational assistant (shared by all roots).
const String agentsDefaultConversationAgentId = 'agent.chat.default';

/// Entry surface recorded on sessions created by this root.
///
/// `AgentSessionEntrySurface` in the app API enumerates `flutter` alongside
/// `pc`, `h5`, and `mini_program`.
const String agentsConversationEntrySurface = 'flutter';

/// Page size used when listing the caller's sessions for the history screen.
const int agentsConversationSessionPageSize = 50;

const int agentsConversationAgentCacheTtlMs = 5 * 60 * 1000;

/// Wire protocol that turns on the rich `agent.stream.*` event family.
const String agentsConversationEventProtocolKernelV1 = 'kernel-v1';

/// Agent provisioning port, implemented by the agents capability.
///
/// Keeping it abstract means the conversation package has no compile-time
/// dependency on a sibling capability package.
abstract class AgentsConversationAgentPort {
  /// Returns the built-in assistant id, creating the record when absent.
  Future<String> ensureAgent({String? model});

  /// Optional built-in assistant model sync (requires `ai.agents.manage`).
  ///
  /// Implementations may no-op when the caller lacks the permission.
  Future<void> updateAgentModel(String agentId, String model);
}

abstract class AgentsConversationService {
  /// Resolves the runtime model id used when the caller supplies none.
  Future<String> resolveDefaultModel({String? preferred});

  Future<List<AgentsConversationSession>> listSessions();

  Future<AgentsConversationSession> createSession(String title);

  Future<void> renameSession(String sessionId, String title);

  Future<void> deleteSession(String sessionId);

  Future<AgentsConversationMessagePage> listMessages(String sessionId, {String? cursor});

  /// Streams one turn; deltas arrive through [handlers].
  Future<AgentsConversationTurnResult> streamTurn(
    AgentsConversationTurnInput input,
    AgentsConversationStreamHandlers handlers,
  );
}

/// SHA-256 digest in the `sha256:<hex>` form every idempotent write requires.
String agentsConversationPayloadHash(Map<String, dynamic> payload) {
  final encoded = jsonEncode(payload);
  return 'sha256:${sha256.convert(utf8.encode(encoded)).toString()}';
}

AgentsConversationService createAgentsConversationService(
  SdkworkAppClient client,
  AgentsConversationAgentPort agentPort,
) {
  String? cachedAgentId;
  var agentCacheExpiresAtMillis = 0;

  Future<String> resolveDefaultModel({String? preferred}) async {
    final response = await client.ai.agentsEnginesList();
    final catalog = sdkworkAgentsResourceItem(response?.data);
    final engines = sdkworkAgentsAsMapList(catalog?['engines']);
    final models = <AgentEngineModelCatalogEntry>[];
    for (final engine in engines) {
      final entries = sdkworkAgentsAsMapList(engine['models']);
      for (final entry in entries) {
        models.add(AgentEngineModelCatalogEntry.fromJson(entry));
      }
    }
    if (models.isEmpty) {
      throw StateError('Agent engine runtime catalog is unavailable.');
    }
    if (preferred != null) {
      for (final model in models) {
        if (model.modelId == preferred) {
          return model.modelId;
        }
      }
    }
    for (final model in models) {
      if (model.defaultForEngine) {
        return model.modelId;
      }
    }
    return models.first.modelId;
  }

  Future<String> resolveAgentId({String? model}) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final cached = cachedAgentId;
    if (cached != null && agentCacheExpiresAtMillis > now) {
      return cached;
    }
    final resolved = await agentPort.ensureAgent(model: model);
    cachedAgentId = resolved;
    agentCacheExpiresAtMillis = now + agentsConversationAgentCacheTtlMs;
    return resolved;
  }

  Future<AgentsConversationSession> createSession(String title) async {
    final agentId = await resolveAgentId();
    final normalizedTitle = title.trim().isEmpty ? 'New chat' : title.trim();
    final payload = <String, dynamic>{
      'sessionKind': 'assistant',
      'entrySurface': agentsConversationEntrySurface,
      'title': normalizedTitle,
    };
    final response = await client.ai.agentsSessionsCreate(
      agentId,
      CreateAgentSessionRequest(
        agentId: agentId,
        sessionKind: 'assistant',
        entrySurface: agentsConversationEntrySurface,
        title: normalizedTitle,
        idempotencyKey: generateSecureHexId(prefix: 'flutter-session'),
        payloadHash: agentsConversationPayloadHash(payload),
        requestedAt: DateTime.now().toUtc().toIso8601String(),
      ),
    );
    final record = sdkworkAgentsResourceItem(response?.data);
    final mapped = record == null ? null : mapAgentsConversationSession(record);
    if (mapped == null) {
      throw StateError('Chat session create did not return sessionId.');
    }
    return mapped;
  }

  void dispatchRichEvent(
    AgentTurnRuntimeEvent? runtimeEvent,
    AgentsConversationStreamHandlers handlers,
  ) {
    if (runtimeEvent == null) {
      return;
    }
    final payload = runtimeEvent.payload;
    switch (runtimeEvent.type) {
      case 'agent.stream.message.delta':
        // Reasoning deltas surface only via rich events. Visible answer text
        // already arrives as `delta` frames, so forwarding text-kind events
        // here would double-render the answer.
        if (payload['kind'] != 'reasoning') {
          return;
        }
        final delta = payload['delta']?.toString();
        if (delta == null || delta.isEmpty) {
          return;
        }
        handlers.onReasoning?.call(delta);
      case 'agent.stream.tool.call.start':
        handlers.onToolEvent?.call(
          AgentsConversationToolStreamEvent(
            phase: AgentsConversationToolPhase.start,
            toolCallId: payload['tool_call_id']?.toString(),
            toolName: payload['tool_name']?.toString(),
          ),
        );
      case 'agent.stream.tool.call.delta':
        handlers.onToolEvent?.call(
          AgentsConversationToolStreamEvent(
            phase: AgentsConversationToolPhase.delta,
            toolCallId: payload['tool_call_id']?.toString(),
            delta: payload['delta']?.toString(),
          ),
        );
      case 'agent.stream.tool.call.stop':
        handlers.onToolEvent?.call(
          AgentsConversationToolStreamEvent(
            phase: AgentsConversationToolPhase.stop,
            toolCallId: payload['tool_call_id']?.toString(),
            toolName: payload['tool_name']?.toString(),
          ),
        );
      case 'agent.stream.tool.result':
        // The result terminal event closes the card lifecycle for executors
        // that skip the call.stop frame (e.g. the built-in MCP tool loop).
        handlers.onToolEvent?.call(
          AgentsConversationToolStreamEvent(
            phase: AgentsConversationToolPhase.stop,
            toolCallId: payload['tool_call_id']?.toString(),
            toolName: payload['tool_name']?.toString(),
            result: payload['content']?.toString(),
            isError: payload['is_error'] == true,
          ),
        );
      default:
        return;
    }
  }

  return _AgentsConversationServiceImpl(
    client: client,
    resolveDefaultModel: resolveDefaultModel,
    resolveAgentId: resolveAgentId,
    createSession: createSession,
    dispatchRichEvent: dispatchRichEvent,
  );
}

class _AgentsConversationServiceImpl implements AgentsConversationService {
  _AgentsConversationServiceImpl({
    required this.client,
    required Future<String> Function({String? preferred}) resolveDefaultModel,
    required this.resolveAgentId,
    required Future<AgentsConversationSession> Function(String title) createSession,
    required this.dispatchRichEvent,
  })  : _resolveDefaultModel = resolveDefaultModel,
        _createSession = createSession;

  final SdkworkAppClient client;
  final Future<String> Function({String? preferred}) _resolveDefaultModel;
  final Future<String> Function({String? model}) resolveAgentId;
  final Future<AgentsConversationSession> Function(String title) _createSession;
  final void Function(AgentTurnRuntimeEvent?, AgentsConversationStreamHandlers)
      dispatchRichEvent;

  @override
  Future<String> resolveDefaultModel({String? preferred}) =>
      _resolveDefaultModel(preferred: preferred);

  @override
  Future<AgentsConversationSession> createSession(String title) =>
      _createSession(title);

  @override
  Future<List<AgentsConversationSession>> listSessions() async {
    final agentId = await resolveAgentId();
    final response =
        await client.ai.agentsSessionsList(agentId, null, agentsConversationSessionPageSize);
    final sessions = <AgentsConversationSession>[];
    for (final record in sdkworkAgentsPageItems(response?.data)) {
      final mapped = mapAgentsConversationSession(record);
      if (mapped != null) {
        sessions.add(mapped);
      }
    }
    sessions.sort(
      (AgentsConversationSession left, AgentsConversationSession right) =>
          right.updatedAtMillis.compareTo(left.updatedAtMillis),
    );
    return sessions;
  }

  @override
  Future<void> renameSession(String sessionId, String title) async {
    final agentId = await resolveAgentId();
    await client.ai.agentsSessionsUpdate(
      agentId,
      sessionId,
      AppUpdateAgentSessionRequest(title: title),
    );
  }

  @override
  Future<void> deleteSession(String sessionId) async {
    final agentId = await resolveAgentId();
    await client.ai.agentsSessionsDelete(agentId, sessionId);
  }

  @override
  Future<AgentsConversationMessagePage> listMessages(
    String sessionId, {
    String? cursor,
  }) async {
    final agentId = await resolveAgentId();
    final response = await client.ai.agentsSessionItemsList(
      agentId,
      sessionId,
      cursor,
      agentsConversationSessionItemPageSize,
      null,
      null,
      '-sequence',
    );
    final data = response?.data;
    final pageInfo = sdkworkAgentsAsMap(sdkworkAgentsAsMap(data)?['pageInfo']);
    final nextCursor = pageInfo?['nextCursor']?.toString();
    return AgentsConversationMessagePage(
      items: normalizeAgentsConversationMessages(sdkworkAgentsPageItems(data)),
      hasMore: pageInfo?['hasMore'] == true,
      nextCursor: nextCursor == null || nextCursor.isEmpty ? null : nextCursor,
    );
  }

  @override
  Future<AgentsConversationTurnResult> streamTurn(
    AgentsConversationTurnInput input,
    AgentsConversationStreamHandlers handlers,
  ) async {
    final agentId = await resolveAgentId();
    final requestId = generateSecureHexId(prefix: 'flutter-turn');
    final runtimeModel = await resolveDefaultModel(preferred: input.model);
    const contentType = 'text/plain';
    final content = input.content.trim();
    final systemPrompt = input.systemPrompt?.trim();
    final body = CreateAgentTurnRequest(
      content: content,
      contentType: contentType,
      turnMode: 'interactive',
      systemPrompt: systemPrompt == null || systemPrompt.isEmpty ? null : systemPrompt,
      wireProtocol: input.wireProtocol,
      requestedAt: DateTime.now().toUtc().toIso8601String(),
      idempotencyKey: requestId,
      payloadHash: agentsConversationPayloadHash(<String, dynamic>{
        'content': content,
        'contentType': contentType,
        'requestedModelId': runtimeModel,
      }),
      clientRequestId: requestId,
      requestedModelId: runtimeModel,
    );

    Map<String, dynamic>? completionItem;
    await for (final event in client.ai.agentsTurnsStream(
      agentId,
      input.sessionId,
      body,
      true,
      agentsConversationEventProtocolKernelV1,
    )) {
      switch (event.eventType) {
        case 'event':
          dispatchRichEvent(event.event, handlers);
        case 'delta':
          final delta = event.delta;
          if (delta != null && delta.isNotEmpty) {
            handlers.onDelta?.call(delta);
          }
        case 'completion':
          final item = sdkworkAgentsResourceItem(event.response?.data);
          if (item != null) {
            completionItem = item;
          }
        default:
          break;
      }
    }

    final items = sdkworkAgentsAsMapList(completionItem?['items']);
    for (var index = items.length - 1; index >= 0; index -= 1) {
      final item = items[index];
      if (item['kind'] == 'assistant_output' && item['itemId'] is String) {
        return AgentsConversationTurnResult(
          id: item['itemId'] as String,
          content: item['content']?.toString() ?? '',
        );
      }
    }
    throw StateError('Agent turn stream did not return an assistant_output item.');
  }
}
