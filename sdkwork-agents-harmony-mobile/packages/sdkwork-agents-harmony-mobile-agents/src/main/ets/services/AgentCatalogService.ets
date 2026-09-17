import { type AgentsAppSdkClient } from '@sdkwork/sdkwork-agents-harmony-mobile-core';

import { type AgentsCatalogListItem } from '../models/AgentModels';

/**
 * Use-case orchestration for the agents catalog.
 *
 * Services receive explicit runtime inputs (injected SDK clients, config, host
 * adapters) and never construct SDK clients themselves.
 */
export class AgentCatalogService {
  private readonly client: AgentsAppSdkClient;

  constructor(client: AgentsAppSdkClient) {
    this.client = client;
  }

  async listAgents(pageSize: number): Promise<AgentsCatalogListItem[]> {
    if (pageSize <= 0) {
      throw new Error('pageSize must be a positive integer');
    }
    // The ArkTS-adapted transport is not generated yet; the port is injected so
    // this service compiles unchanged once the adapter lands.
    return [];
  }

  baseUrl(): string {
    return this.client.baseUrl;
  }
}
