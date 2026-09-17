import { AgentCatalogService } from '../../services/AgentCatalogService';
import { type AgentsCatalogScreenModel } from '../../models/AgentModels';

/**
 * Catalog view model. Owns UI state mapping; calls services only.
 */
export class AgentsCatalogViewModel {
  private readonly service: AgentCatalogService;
  private model: AgentsCatalogScreenModel = {
    items: [],
    loading: false,
    hasMore: false,
  };

  constructor(service: AgentCatalogService) {
    this.service = service;
  }

  state(): AgentsCatalogScreenModel {
    return this.model;
  }

  async load(pageSize: number): Promise<AgentsCatalogScreenModel> {
    this.model = { items: this.model.items, loading: true, hasMore: false };
    try {
      const items = await this.service.listAgents(pageSize);
      this.model = { items, loading: false, hasMore: items.length >= pageSize };
    } catch (error) {
      this.model = {
        items: [],
        loading: false,
        hasMore: false,
        errorMessage: error instanceof Error ? error.message : 'unknown-error',
      };
    }
    return this.model;
  }
}
