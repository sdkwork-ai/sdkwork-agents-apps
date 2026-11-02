import {
  loadingAgentsPageSnapshot,
  type AgentsPageSnapshot,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';

import { type AgentsCatalogListItem } from '../../models/AgentModels';
import { AgentCatalogService } from '../../services/AgentCatalogService';

/**
 * Catalog view model. Owns UI state mapping; calls services only.
 */
export class AgentsCatalogViewModel {
  private readonly service: AgentCatalogService;
  private snapshot: AgentsPageSnapshot<AgentsCatalogListItem> =
    loadingAgentsPageSnapshot<AgentsCatalogListItem>();

  constructor(service: AgentCatalogService) {
    this.service = service;
  }

  state(): AgentsPageSnapshot<AgentsCatalogListItem> {
    return this.snapshot;
  }

  async load(pageSize: number): Promise<AgentsPageSnapshot<AgentsCatalogListItem>> {
    this.snapshot = loadingAgentsPageSnapshot<AgentsCatalogListItem>();
    this.snapshot = await this.service.listAgents(pageSize);
    return this.snapshot;
  }
}
