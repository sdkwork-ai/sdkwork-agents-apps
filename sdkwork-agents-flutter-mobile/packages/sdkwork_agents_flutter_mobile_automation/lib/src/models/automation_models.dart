/// Automation domain models for the Agents Flutter mobile surfaces.
///
/// Semantics follow `AGENTS_DOMAIN_SPEC.md`: a scheduled automation is an
/// `AgentTask` scoped to one managed agent.
library;

class AgentsTaskSummary {
  const AgentsTaskSummary({
    required this.id,
    required this.name,
    this.status,
    this.schedule,
    this.updatedAt,
  });

  final String id;
  final String name;

  /// Raw server status (`active`, `paused`, `completed`, `cancelled`, ...).
  final String? status;

  /// Cron expression or ISO timestamp, when the task is scheduled.
  final String? schedule;
  final String? updatedAt;
}

class AgentsTaskPage {
  const AgentsTaskPage({
    required this.items,
    required this.page,
    required this.hasMore,
  });

  final List<AgentsTaskSummary> items;
  final int page;
  final bool hasMore;
}

/// Result of draining the aggregate for a tab that shows the whole list at once.
class AgentsTasksListing {
  const AgentsTasksListing({required this.items, required this.truncated});

  final List<AgentsTaskSummary> items;

  /// True when the drain stopped at the page ceiling with more rows remaining.
  final bool truncated;
}
