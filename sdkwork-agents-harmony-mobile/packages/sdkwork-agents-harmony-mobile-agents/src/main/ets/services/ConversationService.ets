import {
  readAgentsHarmonySession,
  unavailableAgentsPageSnapshot,
  unauthenticatedAgentsPageSnapshot,
  failedAgentsPageSnapshot,
  readyAgentsPageSnapshot,
  type AgentsAppSdkClient,
  type AgentsAppSdkMessageRecord,
  type AgentsPageSnapshot,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';

import { type AgentsConversationMessage, type AgentsMessageRole } from '../models/AgentModels';

/**
 * Conversation use cases for the chat surface.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 4 and
 * `APP_SDK_INTEGRATION_SPEC.md` — the session comes from the core session store
 * and messages come from the injected app SDK client. This service never
 * fabricates a transcript: without an adapted `conversations` transport the
 * screen renders the explicit `unavailable` state with retry.
 */
export class ConversationService {
  private readonly client: AgentsAppSdkClient | null;

  constructor(client: AgentsAppSdkClient | null) {
    this.client = client;
  }

  /** True when the injected client can actually serve conversation calls. */
  canSend(): boolean {
    const client: AgentsAppSdkClient | null = this.client;
    return client !== null && client.conversations !== undefined && readAgentsHarmonySession() !== null;
  }

  async loadMessages(
    sessionId: string | undefined,
    pageSize: number,
  ): Promise<AgentsPageSnapshot<AgentsConversationMessage>> {
    const client: AgentsAppSdkClient | null = this.client;
    if (client === null || client.conversations === undefined) {
      return unavailableAgentsPageSnapshot<AgentsConversationMessage>('agents.conversation.unavailable');
    }
    if (readAgentsHarmonySession() === null) {
      return unauthenticatedAgentsPageSnapshot<AgentsConversationMessage>(
        'agents.conversation.signInRequired',
      );
    }
    if (sessionId === undefined || sessionId.length === 0) {
      // A brand-new conversation has no server transcript yet; that is genuinely
      // empty, not unavailable.
      return readyAgentsPageSnapshot<AgentsConversationMessage>([]);
    }
    try {
      const page = await client.conversations.listMessages(sessionId, pageSize);
      const messages: AgentsConversationMessage[] = page.items.map(
        (record: AgentsAppSdkMessageRecord) => ConversationService.toMessage(record),
      );
      return readyAgentsPageSnapshot<AgentsConversationMessage>(messages, page.nextCursor);
    } catch (error) {
      return failedAgentsPageSnapshot<AgentsConversationMessage>('agents.conversation.loadFailed');
    }
  }

  /**
   * Sends one message.
   *
   * Returns the same snapshot vocabulary so the page can report "not sent"
   * without inventing an optimistic local turn that the server never received.
   */
  async sendMessage(
    sessionId: string,
    text: string,
  ): Promise<AgentsPageSnapshot<AgentsConversationMessage>> {
    const trimmed: string = text.trim();
    if (trimmed.length === 0) {
      return failedAgentsPageSnapshot<AgentsConversationMessage>('agents.conversation.emptyPrompt');
    }
    const client: AgentsAppSdkClient | null = this.client;
    if (client === null || client.conversations === undefined) {
      return unavailableAgentsPageSnapshot<AgentsConversationMessage>('agents.conversation.unavailable');
    }
    if (readAgentsHarmonySession() === null) {
      return unauthenticatedAgentsPageSnapshot<AgentsConversationMessage>(
        'agents.conversation.signInRequired',
      );
    }
    try {
      const record = await client.conversations.sendMessage(sessionId, trimmed);
      return readyAgentsPageSnapshot<AgentsConversationMessage>([ConversationService.toMessage(record)]);
    } catch (error) {
      return failedAgentsPageSnapshot<AgentsConversationMessage>('agents.conversation.sendFailed');
    }
  }

  private static toMessage(record: AgentsAppSdkMessageRecord): AgentsConversationMessage {
    return {
      id: record.id,
      role: ConversationService.toRole(record.role),
      text: record.text,
      createdAt: record.createdAt ?? '',
    };
  }

  private static toRole(role: string): AgentsMessageRole {
    if (role === 'assistant' || role === 'system') {
      return role;
    }
    return 'user';
  }
}
