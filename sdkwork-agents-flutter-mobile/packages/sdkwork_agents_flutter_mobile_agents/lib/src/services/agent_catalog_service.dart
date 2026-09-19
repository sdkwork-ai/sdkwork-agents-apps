/// Agents catalog orchestration for the Agents Flutter mobile root.
///
/// The SDK client is injected by root bootstrap; this service maps records and
/// interprets pagination only and never constructs transport. The catalog has
/// two scopes — the caller's own agents and the marketplace — matching the PC,
/// H5, and mini program roots.
///
/// Authority: `FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` section 4 (`services/`)
/// and `PAGINATION_SPEC.md`.
library;

import 'package:sdkwork_agents_app_sdk/sdkwork_agents_app_sdk.dart';
import 'package:sdkwork_agents_flutter_mobile_core/sdkwork_agents_flutter_mobile_core.dart';

import '../models/agent_models.dart';

const int defaultAgentsCatalogPageSize = 20;

/// Wire values accepted by `GET /ai/agents?scope=`.
String resolveAgentsCatalogScopeValue(AgentsCatalogScope scope) {
  return scope == AgentsCatalogScope.market ? 'market' : 'mine';
}

class AgentCatalogService {
  const AgentCatalogService({required this.client});

  final SdkworkAppClient client;

  Future<AgentsCatalogPage> loadPage({
    required int page,
    AgentsCatalogScope scope = AgentsCatalogScope.mine,
    int pageSize = defaultAgentsCatalogPageSize,
    String? query,
  }) async {
    if (page < 1) {
      throw ArgumentError.value(page, 'page', 'must be a positive integer');
    }
    if (pageSize < 1) {
      throw ArgumentError.value(pageSize, 'pageSize', 'must be a positive integer');
    }
    // The Dart generator flattens the sub-resource tree: the operation is
    // `AiApi.agentsList`, not `AiApi.agents.list`.
    final response = await client.ai.agentsList(
      null,
      resolveAgentsCatalogScopeValue(scope),
      page,
      pageSize,
      query,
    );
    final data = response?.data;
    final pageInfo = sdkworkAgentsAsMap(sdkworkAgentsAsMap(data)?['pageInfo']);
    return AgentsCatalogPage(
      items: extractAgentsCatalogItems(sdkworkAgentsPageItems(data)),
      page: page,
      hasMore: resolveAgentsCatalogHasMore(
        pageInfo == null ? null : PageInfo.fromJson(pageInfo),
      ),
    );
  }
}

/// Structural mapping because the record DTO is read field-by-field.
List<AgentsCatalogItem> extractAgentsCatalogItems(List<Map<String, dynamic>> records) {
  final items = <AgentsCatalogItem>[];
  for (final record in records) {
    final id = record['agentId'] ?? record['id'] ?? record['code'];
    if (id is! String || id.isEmpty) {
      continue;
    }
    final name = record['displayName']?.toString() ?? record['code']?.toString() ?? 'Agent';
    items.add(
      AgentsCatalogItem(
        id: id,
        name: name,
        description: record['description']?.toString() ?? '',
      ),
    );
  }
  return items;
}

/// Interprets the offset `pageInfo` envelope of `/ai/agents`.
bool resolveAgentsCatalogHasMore(PageInfo? pageInfo) {
  if (pageInfo == null) {
    return false;
  }
  if (pageInfo.hasMore == true) {
    return true;
  }
  final page = pageInfo.page ?? 1;
  final totalPages = pageInfo.totalPages ?? 0;
  return totalPages > 0 && page < totalPages;
}
