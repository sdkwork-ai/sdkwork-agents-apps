/**
 * View/screen models for the agents capability.
 *
 * API DTOs come from generated ArkTS/TypeScript SDKs; this file owns view
 * models, screen models, and route params only.
 */
export interface AgentsCatalogListItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly avatarUrl: string;
}

export interface AgentsConversationRouteParams {
  readonly agentId: string;
  readonly sessionId?: string;
}

export type AgentsMessageRole = 'user' | 'assistant' | 'system';

export interface AgentsConversationMessage {
  readonly id: string;
  readonly role: AgentsMessageRole;
  readonly text: string;
  readonly createdAt: string;
}
