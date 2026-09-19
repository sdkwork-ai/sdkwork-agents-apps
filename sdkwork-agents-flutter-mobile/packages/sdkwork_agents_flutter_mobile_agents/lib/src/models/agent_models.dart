/// View models, screen models, and route params for the agents capability.
///
/// API DTOs come from the generated Dart app SDK; this file owns view models
/// only.
library;

/// Which slice of the catalog a screen is showing.
enum AgentsCatalogScope { mine, market }

class AgentsCatalogItem {
  const AgentsCatalogItem({
    required this.id,
    required this.name,
    required this.description,
  });

  final String id;
  final String name;
  final String description;
}

class AgentsCatalogPage {
  const AgentsCatalogPage({
    required this.items,
    required this.page,
    required this.hasMore,
  });

  final List<AgentsCatalogItem> items;
  final int page;
  final bool hasMore;
}

class AgentsRouteParams {
  const AgentsRouteParams({required this.agentId, this.sessionId});

  final String agentId;
  final String? sessionId;
}
