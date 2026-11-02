import {
  loadingAgentsPageSnapshot,
  type AgentsPageSnapshot,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';

import { type AgentsConversationMessage } from '../../models/AgentModels';
import { ConversationService } from '../../services/ConversationService';

/**
 * Conversation view model. Owns UI state mapping; calls services only.
 */
export class ConversationViewModel {
  private readonly service: ConversationService;
  private snapshot: AgentsPageSnapshot<AgentsConversationMessage> =
    loadingAgentsPageSnapshot<AgentsConversationMessage>();

  constructor(service: ConversationService) {
    this.service = service;
  }

  state(): AgentsPageSnapshot<AgentsConversationMessage> {
    return this.snapshot;
  }

  async load(sessionId: string | undefined): Promise<AgentsPageSnapshot<AgentsConversationMessage>> {
    this.snapshot = loadingAgentsPageSnapshot<AgentsConversationMessage>();
    this.snapshot = await this.service.loadMessages(sessionId, 50);
    return this.snapshot;
  }

  async send(
    sessionId: string,
    text: string,
  ): Promise<AgentsPageSnapshot<AgentsConversationMessage>> {
    return this.service.sendMessage(sessionId, text);
  }
}
