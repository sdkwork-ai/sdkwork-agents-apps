import {
  readAgentsHarmonySession,
  unavailableAgentsPageSnapshot,
  unauthenticatedAgentsPageSnapshot,
  failedAgentsPageSnapshot,
  readyAgentsPageSnapshot,
  type AgentsAppSdkClient,
  type AgentsAppSdkAgentRecord,
  type AgentsPageSnapshot,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';

import { type AgentsCatalogListItem } from '../models/AgentModels';

/**
 * Use-case orchestration for the agents catalog.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 4 — services receive
 * injected SDK clients (or a null seam) and never construct SDK clients
 * themselves. A null client or a client without the `agentCatalog` sub-client
 * means this root has no adapted ArkTS transport yet: that is reported as
 * `unavailable`, never as an empty catalog.
 */
export class AgentCatalogService {
  private readonly client: AgentsAppSdkClient | null;

  constructor(client: AgentsAppSdkClient | null) {
    this.client = client;
  }

  async listAgents(pageSize: number): Promise<AgentsPageSnapshot<AgentsCatalogListItem>> {
    if (pageSize <= 0) {
      throw new Error('pageSize must be a positive integer');
    }
    const client: AgentsAppSdkClient | null = this.client;
    if (client === null || client.agentCatalog === undefined) {
      return unavailableAgentsPageSnapshot<AgentsCatalogListItem>('agents.catalog.unavailable');
    }
    if (readAgentsHarmonySession() === null) {
      return unauthenticatedAgentsPageSnapshot<AgentsCatalogListItem>('agents.catalog.signInRequired');
    }
    try {
      const page = await client.agentCatalog.listAgents(pageSize);
      const items: AgentsCatalogListItem[] = page.items.map(
        (record: AgentsAppSdkAgentRecord) => AgentCatalogService.toListItem(record),
      );
      return readyAgentsPageSnapshot<AgentsCatalogListItem>(items, page.nextCursor);
    } catch (error) {
      return failedAgentsPageSnapshot<AgentsCatalogListItem>('agents.catalog.loadFailed');
    }
  }

  baseUrl(): string {
    const client: AgentsAppSdkClient | null = this.client;
    return client === null ? '' : client.baseUrl;
  }

  private static toListItem(record: AgentsAppSdkAgentRecord): AgentsCatalogListItem {
    return {
      id: record.id,
      name: record.name,
      description: record.description ?? '',
      avatarUrl: record.avatarUrl ?? '',
    };
  }
}
