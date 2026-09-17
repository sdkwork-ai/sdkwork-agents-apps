/**
 * View models, screen models, and route params for the agents capability.
 *
 * API DTOs come from the generated app SDK; this file owns view models only.
 */
export interface AgentsMpCatalogItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface AgentsMpCatalogPage {
  readonly items: AgentsMpCatalogItem[];
  readonly page: number;
  readonly hasMore: boolean;
}

export interface AgentsMpRouteParams {
  readonly agentId?: string;
  readonly sessionId?: string;
}
