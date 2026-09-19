/// Project domain models for the Agents Flutter mobile surfaces.
///
/// Semantics follow `AGENTS_DOMAIN_SPEC.md`: a project is an `AgentProject` that
/// owns sessions and Drive sandbox roots.
library;

class AgentsProjectSummary {
  const AgentsProjectSummary({
    required this.id,
    required this.name,
    this.description,
    this.status,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final String? status;
  final String? updatedAt;
}

class AgentsProjectPage {
  const AgentsProjectPage({
    required this.items,
    required this.page,
    required this.hasMore,
  });

  final List<AgentsProjectSummary> items;
  final int page;
  final bool hasMore;
}

/// Result of draining the listing for a tab that shows the whole set at once.
class AgentsProjectsListing {
  const AgentsProjectsListing({required this.items, required this.truncated});

  final List<AgentsProjectSummary> items;

  /// True when the drain stopped at the page ceiling with more rows remaining.
  final bool truncated;
}
