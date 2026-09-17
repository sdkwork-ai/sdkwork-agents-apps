import 'package:sdkwork_agents_app_sdk/sdkwork_agents_app_sdk.dart';

import '../models/agent_models.dart';

/// Agents catalog orchestration.
///
/// The SDK client is injected by root bootstrap; this service maps records and
/// interprets pagination only and never constructs transport.
///
/// Authority: `FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` section 4
/// (`services/`) and `PAGINATION_SPEC.md`.
const int defaultAgentsCatalogPageSize = 20;

class AgentCatalogService {
  const AgentCatalogService({required this.client});

  final SdkworkAppClient client;

  Future<AgentsCatalogPage> loadPage({
    required int page,
    int pageSize = defaultAgentsCatalogPageSize,
  }) async {
    if (page < 1) {
      throw ArgumentError.value(page, 'page', 'must be a positive integer');
    }
    if (pageSize < 1) {
      throw ArgumentError.value(pageSize, 'pageSize', 'must be a positive integer');
    }
    final response = await client.ai.agents.list(
      page: page,
      pageSize: pageSize,
    );
    final items = extractAgentsCatalogItems(response);
    return AgentsCatalogPage(
      items: items,
      page: page,
      hasMore: resolveAgentsCatalogHasMore(response),
    );
  }
}

/// Structural mapping because the transport DTO is generator-owned.
List<AgentsCatalogItem> extractAgentsCatalogItems(Object? response) {
  final records = _extractRecords(response);
  final items = <AgentsCatalogItem>[];
  for (final record in records) {
    final mapped = _mapRecord(record);
    if (mapped != null) {
      items.add(mapped);
    }
  }
  return items;
}

List<Object?> _extractRecords(Object? response) {
  if (response is Map) {
    final items = response['items'];
    if (items is List) {
      return items;
    }
    final data = response['data'];
    if (data is Map && data['items'] is List) {
      return data['items'] as List;
    }
  }
  return const <Object?>[];
}

AgentsCatalogItem? _mapRecord(Object? record) {
  if (record is! Map) {
    return null;
  }
  final id = record['agentId'] ?? record['id'] ?? record['code'];
  if (id is! String || id.isEmpty) {
    return null;
  }
  final name = record['displayName'] ?? record['code'] ?? 'Agent';
  final description = record['description'];
  return AgentsCatalogItem(
    id: id,
    name: name is String ? name : name.toString(),
    description: description is String ? description : '',
  );
}

bool resolveAgentsCatalogHasMore(Object? response) {
  if (response is! Map) {
    return false;
  }
  Map<Object?, Object?> pageInfo = const <Object?, Object?>{};
  final direct = response['pageInfo'];
  if (direct is Map) {
    pageInfo = direct;
  } else {
    final data = response['data'];
    if (data is Map && data['pageInfo'] is Map) {
      pageInfo = data['pageInfo'] as Map;
    }
  }
  if (pageInfo['hasMore'] == true) {
    return true;
  }
  final page = int.tryParse((pageInfo['page'] ?? 1).toString()) ?? 1;
  final totalPages = int.tryParse(
        (pageInfo['totalPages'] ?? pageInfo['total_pages'] ?? 0).toString(),
      ) ??
      0;
  return totalPages > 0 && page < totalPages;
}
