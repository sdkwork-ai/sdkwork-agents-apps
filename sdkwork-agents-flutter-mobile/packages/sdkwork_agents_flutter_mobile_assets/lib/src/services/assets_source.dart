/// Asset library data port and the Agents app-SDK implementation.
///
/// The generated Flutter app SDK exposes `GET /ai/assets`
/// (`client.ai.agentsAssetsList()`), the Agents-owned projection of media the
/// runtime persisted to Drive. That is a real SDK transport, so the asset tab is
/// SDK-backed rather than an unavailable placeholder. No raw HTTP is used.
library;

import 'package:sdkwork_agents_app_sdk/sdkwork_agents_app_sdk.dart';
import 'package:sdkwork_agents_flutter_mobile_core/sdkwork_agents_flutter_mobile_core.dart';

import '../models/assets_models.dart';

abstract class AgentsAssetsSource {
  Future<List<AgentsAssetItem>> listAssets();
}

/// Source backed by the generated Agents app SDK.
class AgentsAssetSdkSource implements AgentsAssetsSource {
  const AgentsAssetSdkSource({required this.client});

  final SdkworkAppClient client;

  @override
  Future<List<AgentsAssetItem>> listAssets() async {
    final response = await client.ai.agentsAssetsList();
    final data = response?.data;
    final records = data is List
        ? sdkworkAgentsAsMapList(data)
        : sdkworkAgentsPageItems(data);
    final items = <AgentsAssetItem>[];
    final seen = <String>{};
    for (final record in records) {
      final mapped = mapAgentsAssetRecord(record);
      if (mapped != null && seen.add(mapped.id)) {
        items.add(mapped);
      }
    }
    return items;
  }
}

AgentsAssetsSource createAgentsAssetSdkSource(SdkworkAppClient client) {
  return AgentsAssetSdkSource(client: client);
}

/// Maps one `ToolAssetView` record onto the asset view model.
AgentsAssetItem? mapAgentsAssetRecord(Map<String, dynamic> record) {
  final id = sdkworkAgentsAsString(record['driveNodeId']) ??
      sdkworkAgentsAsString(record['assetId']) ??
      sdkworkAgentsAsString(record['id']);
  if (id == null || id.isEmpty) {
    return null;
  }
  final mediaKind = sdkworkAgentsAsString(record['mediaKind']) ?? '';
  return AgentsAssetItem(
    id: id,
    kind: AgentsAssetKind.fromWire(mediaKind),
    mediaKind: mediaKind,
    toolId: sdkworkAgentsAsString(record['toolId']),
    createdAt: sdkworkAgentsAsString(record['createdAt']),
    driveUri: sdkworkAgentsAsString(record['driveUri']),
    sourceUrl: sdkworkAgentsAsString(record['sourceUrl']),
  );
}

List<AgentsAssetItem> filterAgentsAssets(
  List<AgentsAssetItem> items,
  AgentsAssetKind? kind,
) {
  if (kind == null) {
    return List<AgentsAssetItem>.from(items);
  }
  return items
      .where((AgentsAssetItem item) => item.kind == kind)
      .toList(growable: false);
}

/// Groups assets by local calendar day, newest first, preserving newest-first
/// item order inside each bucket.
List<AgentsAssetGroup> groupAgentsAssetsByDate(List<AgentsAssetItem> items) {
  final buckets = <String, List<AgentsAssetItem>>{};
  for (final item in items) {
    final created = item.createdAtDate;
    final key = created == null ? agentsAssetUnknownDateKey : _dateKey(created);
    buckets.putIfAbsent(key, () => <AgentsAssetItem>[]).add(item);
  }
  final keys = buckets.keys.toList(growable: false)
    ..sort((String left, String right) {
      if (left == agentsAssetUnknownDateKey) {
        return 1;
      }
      if (right == agentsAssetUnknownDateKey) {
        return -1;
      }
      return right.compareTo(left);
    });
  return <AgentsAssetGroup>[
    for (final key in keys)
      AgentsAssetGroup(dateKey: key, items: buckets[key]!),
  ];
}

String _dateKey(DateTime value) {
  final month = value.month.toString().padLeft(2, '0');
  final day = value.day.toString().padLeft(2, '0');
  return '${value.year}-$month-$day';
}
