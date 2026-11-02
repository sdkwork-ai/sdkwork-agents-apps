/// Creative studio data port for the Agents Flutter mobile root.
///
/// The generated Flutter app SDK exposes the media-tool directory and invoke
/// operations (`/ai/tools`), so the studio submits real commands instead of
/// reporting the capability unavailable. Results are kept in memory for the
/// session; the persisted `/ai/assets` library remains the durable record.
library;

import 'package:sdkwork_agents_app_sdk/sdkwork_agents_app_sdk.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_core/sdkwork_agents_flutter_mobile_core.dart';

import '../models/creative_models.dart';

abstract class AgentsCreativeSource {
  Future<AgentsCreativeSessionPage> listSessions({String? cursor});

  Future<AgentsCreativeSession> loadSession(String sessionId);

  Future<AgentsCreativeSubmission> submit({
    required String prompt,
    required AgentsCreativeModality modality,
    required AgentsCreativeAspectRatio aspectRatio,
  });
}

/// Source backed by the Agents app API media-tool surface.
class AgentsCreativeToolSource implements AgentsCreativeSource {
  AgentsCreativeToolSource({required this.client});

  final SdkworkAppClient client;

  final Map<String, AgentsCreativeSession> _sessions =
      <String, AgentsCreativeSession>{};
  List<Map<String, dynamic>>? _directory;

  @override
  Future<AgentsCreativeSessionPage> listSessions({String? cursor}) async {
    final items = _sessions.values
        .map((AgentsCreativeSession session) => session.summary)
        .toList(growable: false)
      ..sort((AgentsCreativeSessionSummary left,
              AgentsCreativeSessionSummary right) =>
          (right.createdAt ?? '').compareTo(left.createdAt ?? ''));
    return AgentsCreativeSessionPage(items: items);
  }

  @override
  Future<AgentsCreativeSession> loadSession(String sessionId) async {
    final session = _sessions[sessionId];
    if (session == null) {
      throw const SdkworkAgentsCapabilityUnavailableException(
        'creative',
        detail: 'The requested creative session is no longer available.',
      );
    }
    return session;
  }

  @override
  Future<AgentsCreativeSubmission> submit({
    required String prompt,
    required AgentsCreativeModality modality,
    required AgentsCreativeAspectRatio aspectRatio,
  }) async {
    final tool = await _resolveTool(modality);
    final response = await client.ai.agentsToolsInvoke(
      tool['toolId'] as String,
      MediaToolInvokeBody(
        arguments: <String, dynamic>{
          'prompt': prompt,
          if (_supportsSize(tool)) 'size': _aspectToSize(aspectRatio),
        },
        saveToDrive: true,
      ),
    );
    final data = sdkworkAgentsAsMap(response?.data) ?? <String, dynamic>{};
    final error = (data['error'] as String?)?.trim() ?? '';
    if (error.isNotEmpty) {
      throw SdkworkAgentsCapabilityUnavailableException('creative',
          detail: error);
    }
    final results = _collectResults(data['output'], modality);
    final sessionId = (data['toolCallId'] as String?)?.trim().isNotEmpty == true
        ? (data['toolCallId'] as String).trim()
        : '${tool['toolId']}:${DateTime.now().microsecondsSinceEpoch}';
    final createdAt = DateTime.now().toUtc().toIso8601String();
    final summary = AgentsCreativeSessionSummary(
      id: sessionId,
      title: prompt.length > 42 ? '${prompt.substring(0, 42)}...' : prompt,
      resultCount: results.length,
      createdAt: createdAt,
    );
    _sessions[sessionId] = AgentsCreativeSession(
      summary: summary,
      results: results,
    );
    final status = results.isEmpty ? 'failed' : 'succeeded';
    return AgentsCreativeSubmission(sessionId: sessionId, status: status);
  }

  Future<Map<String, dynamic>> _resolveTool(
    AgentsCreativeModality modality,
  ) async {
    final directory = await _loadDirectory();
    final wanted = _modalityCategory(modality);
    for (final entry in directory) {
      if (entry['enabled'] != true || entry['configured'] == false) {
        continue;
      }
      final category = (entry['category'] as String?)?.trim().toLowerCase();
      final toolId = (entry['toolId'] as String?)?.trim() ?? '';
      if (toolId.isEmpty) {
        continue;
      }
      final matchesCategory = category == wanted;
      final matchesPrefix = toolId.toLowerCase().startsWith('$wanted.');
      if (matchesCategory || matchesPrefix) {
        if (_schemaProperties(entry).contains('prompt')) {
          return entry;
        }
      }
    }
    throw SdkworkAgentsCapabilityUnavailableException(
      'creative',
      detail: 'No prompt-capable $wanted tool is configured for this tenant.',
    );
  }

  Future<List<Map<String, dynamic>>> _loadDirectory() async {
    final cached = _directory;
    if (cached != null) {
      return cached;
    }
    final response = await client.ai.agentsToolsList();
    final entries = sdkworkAgentsAsMapList(response?.data);
    _directory = entries;
    return entries;
  }

  static String _modalityCategory(AgentsCreativeModality modality) {
    switch (modality) {
      case AgentsCreativeModality.image:
        return 'image';
      case AgentsCreativeModality.video:
        return 'video';
      case AgentsCreativeModality.music:
        return 'music';
      case AgentsCreativeModality.voice:
      case AgentsCreativeModality.sfx:
        return '';
    }
  }

  static Set<String> _schemaProperties(Map<String, dynamic> entry) {
    final schema = sdkworkAgentsAsMap(entry['inputSchema']);
    final properties = sdkworkAgentsAsMap(schema?['properties']);
    return properties?.keys.toSet() ?? <String>{};
  }

  static bool _supportsSize(Map<String, dynamic> tool) =>
      _schemaProperties(tool).contains('size');

  static String _aspectToSize(AgentsCreativeAspectRatio aspect) {
    switch (aspect) {
      case AgentsCreativeAspectRatio.square:
        return '1024x1024';
      case AgentsCreativeAspectRatio.portrait:
        return '1024x1536';
      case AgentsCreativeAspectRatio.landscape:
        return '1536x1024';
    }
  }

  static List<AgentsCreativeResult> _collectResults(
    Object? output,
    AgentsCreativeModality modality,
  ) {
    final urls = <String>{};
    _walk(output, urls, 0);
    final results = <AgentsCreativeResult>[];
    for (final url in urls) {
      results.add(
        AgentsCreativeResult(
          id: url,
          url: url,
          kind: _resultKind(modality, url),
        ),
      );
    }
    return results;
  }

  static void _walk(Object? value, Set<String> urls, int depth) {
    if (depth > 4 || urls.length >= 24) {
      return;
    }
    if (value is Map) {
      final map = value.cast<Object?, Object?>();
      final url = map['url'];
      if (url is String && RegExp(r'^https?://').hasMatch(url)) {
        urls.add(url);
        return;
      }
      for (final entry in map.values) {
        _walk(entry, urls, depth + 1);
        if (urls.length >= 24) return;
      }
      return;
    }
    if (value is List) {
      for (final entry in value) {
        _walk(entry, urls, depth + 1);
        if (urls.length >= 24) return;
      }
    }
  }

  static AgentsCreativeResultKind _resultKind(
    AgentsCreativeModality modality,
    String url,
  ) {
    final normalized = url.toLowerCase();
    if (normalized.contains('.mp4') || normalized.contains('.webm')) {
      return AgentsCreativeResultKind.video;
    }
    if (normalized.contains('.mp3') ||
        normalized.contains('.wav') ||
        normalized.contains('.m4a')) {
      return AgentsCreativeResultKind.audio;
    }
    if (modality == AgentsCreativeModality.image) {
      return AgentsCreativeResultKind.image;
    }
    if (modality == AgentsCreativeModality.video) {
      return AgentsCreativeResultKind.video;
    }
    return AgentsCreativeResultKind.other;
  }
}

AgentsCreativeSource createAgentsCreativeToolSource(SdkworkAppClient client) {
  return AgentsCreativeToolSource(client: client);
}

/// Fallback source for a root that has not composed the media-tool transport.
class UnsupportedAgentsCreativeSource implements AgentsCreativeSource {
  const UnsupportedAgentsCreativeSource();

  @override
  Future<AgentsCreativeSessionPage> listSessions({String? cursor}) {
    throw const SdkworkAgentsCapabilityUnavailableException(
      'creative',
      detail: 'No Flutter media-tool transport is composed for this root.',
    );
  }

  @override
  Future<AgentsCreativeSession> loadSession(String sessionId) {
    throw const SdkworkAgentsCapabilityUnavailableException(
      'creative',
      detail: 'No Flutter media-tool transport is composed for this root.',
    );
  }

  @override
  Future<AgentsCreativeSubmission> submit({
    required String prompt,
    required AgentsCreativeModality modality,
    required AgentsCreativeAspectRatio aspectRatio,
  }) {
    throw const SdkworkAgentsCapabilityUnavailableException(
      'creative',
      detail: 'No Flutter media-tool transport is composed for this root.',
    );
  }
}

AgentsCreativeSource createUnsupportedAgentsCreativeSource() {
  return const UnsupportedAgentsCreativeSource();
}
