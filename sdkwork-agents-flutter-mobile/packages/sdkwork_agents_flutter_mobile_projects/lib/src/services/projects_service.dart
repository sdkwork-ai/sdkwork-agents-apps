/// Projects orchestration for the Agents Flutter mobile root.
///
/// The SDK client is injected by the composition root; this service maps records
/// and interprets pagination only and never constructs transport
/// (`FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` section 4).
///
/// Authority: `PAGINATION_SPEC.md` — `/ai/projects` is an offset listing.
library;

import 'package:sdkwork_agents_app_sdk/sdkwork_agents_app_sdk.dart';
import 'package:sdkwork_agents_flutter_mobile_core/sdkwork_agents_flutter_mobile_core.dart';

import '../models/projects_models.dart';

const int agentsProjectsPageSize = 20;
const int agentsProjectsMaxPages = 5;

/// Maps one `AgentProjectRecord` payload onto the project view model.
AgentsProjectSummary? mapAgentsProjectSummary(Map<String, dynamic> record) {
  final id = record['projectId'] ?? record['id'];
  if (id is! String || id.isEmpty) {
    return null;
  }
  final name = record['name']?.toString();
  return AgentsProjectSummary(
    id: id,
    name: name == null || name.isEmpty ? id : name,
    description: record['description']?.toString(),
    status: record['status']?.toString(),
    updatedAt: record['updatedAt']?.toString(),
  );
}

/// Interprets the offset `pageInfo` envelope of `/ai/projects`.
bool resolveAgentsProjectHasMore(PageInfo? pageInfo) {
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

List<AgentsProjectSummary> filterAgentsProjects(
  List<AgentsProjectSummary> items,
  String query,
) {
  final needle = query.trim().toLowerCase();
  if (needle.isEmpty) {
    return List<AgentsProjectSummary>.from(items);
  }
  return items
      .where((AgentsProjectSummary item) => item.name.toLowerCase().contains(needle))
      .toList(growable: false);
}

abstract class AgentsProjectsService {
  Future<AgentsProjectPage> listProjects({
    int page,
    int pageSize,
  });

  /// Drains the listing up to [agentsProjectsMaxPages] for a tab that shows the
  /// whole list at once. Not a batch/export helper (`PAGINATION_SPEC.md`).
  Future<AgentsProjectsListing> loadProjects();
}

AgentsProjectsService createAgentsProjectsService(SdkworkAppClient client) {
  Future<AgentsProjectPage> readPage(int page, int pageSize) async {
    final response = await client.ai.agentsProjectsList(page, pageSize);
    final items = <AgentsProjectSummary>[];
    for (final record in sdkworkAgentsPageItems(response?.data)) {
      final mapped = mapAgentsProjectSummary(record);
      if (mapped != null) {
        items.add(mapped);
      }
    }
    final pageInfo = sdkworkAgentsAsMap(sdkworkAgentsAsMap(response?.data)?['pageInfo']);
    return AgentsProjectPage(
      items: items,
      page: page,
      hasMore: resolveAgentsProjectHasMore(
        pageInfo == null ? null : PageInfo.fromJson(pageInfo),
      ),
    );
  }

  return _AgentsProjectsServiceImpl(readPage: readPage);
}

class _AgentsProjectsServiceImpl implements AgentsProjectsService {
  _AgentsProjectsServiceImpl({required this.readPage});

  final Future<AgentsProjectPage> Function(int page, int pageSize) readPage;

  @override
  Future<AgentsProjectPage> listProjects({
    int page = 1,
    int pageSize = agentsProjectsPageSize,
  }) {
    if (page < 1) {
      throw ArgumentError.value(page, 'page', 'must be a positive integer');
    }
    if (pageSize < 1) {
      throw ArgumentError.value(pageSize, 'pageSize', 'must be a positive integer');
    }
    return readPage(page, pageSize);
  }

  @override
  Future<AgentsProjectsListing> loadProjects() async {
    final collected = <AgentsProjectSummary>[];
    final seen = <String>{};
    for (var page = 1; page <= agentsProjectsMaxPages; page += 1) {
      final result = await readPage(page, agentsProjectsPageSize);
      for (final item in result.items) {
        if (seen.add(item.id)) {
          collected.add(item);
        }
      }
      if (!result.hasMore) {
        return AgentsProjectsListing(items: collected, truncated: false);
      }
    }
    return AgentsProjectsListing(items: collected, truncated: true);
  }
}
