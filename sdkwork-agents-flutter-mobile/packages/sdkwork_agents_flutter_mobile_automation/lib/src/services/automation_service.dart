/// Automation orchestration for the Agents Flutter mobile root.
///
/// The Agents app API scopes scheduled tasks to one managed agent
/// (`/ai/agents/{agentId}/tasks`), so the tab aggregates the caller's own agents
/// with a bounded fan-out and memoizes the result for the tab's lifetime. The
/// agent id source is injected — this package never depends on a sibling
/// capability package (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 5).
library;

import 'package:sdkwork_agents_app_sdk/sdkwork_agents_app_sdk.dart';
import 'package:sdkwork_agents_flutter_mobile_core/sdkwork_agents_flutter_mobile_core.dart';

import '../models/automation_models.dart';

/// How many managed agents the tab fans out over for one aggregation.
const int agentsAutomationAgentFanout = 10;
const int agentsAutomationTaskPageSize = 20;
const int agentsAutomationPageSize = 20;
const int agentsAutomationMaxPages = 5;
const int agentsAutomationCacheTtlMs = 30 * 1000;

/// Supplies the managed agent ids whose tasks belong to the caller.
abstract class AgentsAutomationAgentSource {
  Future<List<String>> listManagedAgentIds(int limit);
}

/// Cron expression or ISO timestamp of a task, when it has one.
String? describeAgentsTaskSchedule(Map<String, dynamic> record) {
  final scheduleKind = record['scheduleKind']?.toString();
  final cron = record['cronExpression']?.toString();
  if (scheduleKind == 'cron' && cron != null && cron.isNotEmpty) {
    return cron;
  }
  final scheduledAt = record['scheduledAt']?.toString();
  if (scheduledAt != null && scheduledAt.isNotEmpty) {
    return scheduledAt;
  }
  return null;
}

String? resolveAgentsTaskStatusKey(String? status) {
  switch (status) {
    case 'active':
    case 'paused':
    case 'completed':
    case 'cancelled':
      return 'agents.automation.status.$status';
    default:
      return null;
  }
}

AgentsTaskSummary? mapAgentsTaskSummary(Map<String, dynamic> record) {
  final id = record['taskId'] ?? record['id'];
  if (id is! String || id.isEmpty) {
    return null;
  }
  final prompt = record['prompt']?.toString() ?? '';
  final title = record['title']?.toString();
  final schedule = describeAgentsTaskSchedule(record);
  return AgentsTaskSummary(
    id: id,
    name: title != null && title.isNotEmpty
        ? title
        : (prompt.length <= 60 ? prompt : prompt.substring(0, 60)),
    status: record['status']?.toString(),
    schedule: schedule,
    updatedAt: record['updatedAt']?.toString(),
  );
}

List<AgentsTaskSummary> filterAgentsTasks(
  List<AgentsTaskSummary> items,
  String query,
) {
  final needle = query.trim().toLowerCase();
  if (needle.isEmpty) {
    return List<AgentsTaskSummary>.from(items);
  }
  return items
      .where((AgentsTaskSummary item) => item.name.toLowerCase().contains(needle))
      .toList(growable: false);
}

abstract class AgentsAutomationService {
  Future<AgentsTaskPage> listTasks({int page, int pageSize});

  /// Drains the aggregate up to [agentsAutomationMaxPages] for a tab that shows
  /// the whole list at once. Not a batch/export helper (`PAGINATION_SPEC.md`).
  Future<AgentsTasksListing> loadTasks();

  /// Drops the memoized aggregation so the next read refetches.
  void resetCache();
}

AgentsAutomationService createAgentsAutomationService(
  SdkworkAppClient client,
  AgentsAutomationAgentSource agentSource,
) {
  return _AgentsAutomationServiceImpl(client: client, agentSource: agentSource);
}

/// Outcome of one agent's task read, so one failing agent cannot blank the tab.
class _FanoutOutcome {
  const _FanoutOutcome({required this.tasks, this.error});

  final List<AgentsTaskSummary> tasks;
  final Object? error;
}

class _AgentsAutomationServiceImpl implements AgentsAutomationService {
  _AgentsAutomationServiceImpl({required this.client, required this.agentSource});

  final SdkworkAppClient client;
  final AgentsAutomationAgentSource agentSource;

  List<AgentsTaskSummary>? _cache;
  var _cacheExpiresAtMillis = 0;

  Future<List<AgentsTaskSummary>> _collect() async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final cached = _cache;
    if (cached != null && _cacheExpiresAtMillis > now) {
      return cached;
    }

    final agentIds = await agentSource.listManagedAgentIds(agentsAutomationAgentFanout);
    final outcomes = await Future.wait(
      agentIds.map((String agentId) async {
        try {
          final response = await client.ai.agentsTasksList(
            agentId,
            null,
            null,
            agentsAutomationTaskPageSize,
          );
          final tasks = <AgentsTaskSummary>[];
          for (final record in sdkworkAgentsPageItems(response?.data)) {
            final mapped = mapAgentsTaskSummary(record);
            if (mapped != null) {
              tasks.add(mapped);
            }
          }
          return _FanoutOutcome(tasks: tasks);
        } catch (error) {
          return _FanoutOutcome(tasks: const <AgentsTaskSummary>[], error: error);
        }
      }),
    );

    final failures = outcomes.where((_FanoutOutcome entry) => entry.error != null).toList();
    if (outcomes.isNotEmpty && failures.length == outcomes.length) {
      // Every agent failed: surface the first reason instead of a silently
      // empty tab.
      throw failures.first.error!;
    }

    final tasks = <AgentsTaskSummary>[
      for (final outcome in outcomes) ...outcome.tasks,
    ];
    tasks.sort(
      (AgentsTaskSummary left, AgentsTaskSummary right) =>
          (right.updatedAt ?? '').compareTo(left.updatedAt ?? ''),
    );
    _cache = tasks;
    _cacheExpiresAtMillis = now + agentsAutomationCacheTtlMs;
    return tasks;
  }

  @override
  Future<AgentsTaskPage> listTasks({
    int page = 1,
    int pageSize = agentsAutomationPageSize,
  }) async {
    if (page < 1) {
      throw ArgumentError.value(page, 'page', 'must be a positive integer');
    }
    if (pageSize < 1) {
      throw ArgumentError.value(pageSize, 'pageSize', 'must be a positive integer');
    }
    final tasks = await _collect();
    final start = _clampIndex((page - 1) * pageSize, tasks.length);
    final end = _clampIndex(page * pageSize, tasks.length);
    return AgentsTaskPage(
      items: tasks.sublist(start, end),
      page: page,
      hasMore: end < tasks.length,
    );
  }

  @override
  Future<AgentsTasksListing> loadTasks() async {
    final collected = <AgentsTaskSummary>[];
    for (var page = 1; page <= agentsAutomationMaxPages; page += 1) {
      final tasks = await _collect();
      final start = _clampIndex((page - 1) * agentsAutomationPageSize, tasks.length);
      final end = _clampIndex(page * agentsAutomationPageSize, tasks.length);
      collected.addAll(tasks.sublist(start, end));
      if (end >= tasks.length) {
        return AgentsTasksListing(items: collected, truncated: false);
      }
    }
    return AgentsTasksListing(items: collected, truncated: true);
  }

  @override
  void resetCache() {
    _cache = null;
    _cacheExpiresAtMillis = 0;
  }
}

/// Bounds an index into `[0, length]` without going through `num.clamp`.
int _clampIndex(int value, int length) {
  if (value < 0) {
    return 0;
  }
  return value > length ? length : value;
}
