import { getUsageSummary } from "@sdkwork/agents-app-sdk";

import { type SdkworkAgentsAppClient } from "../../sdk";

/**
 * Account usage orchestration for the mini program profile hub.
 *
 * `GET /ai/usage/summary` is the Agents app API's real metering feed; the client
 * is injected by the compose root, so this service never constructs transport.
 */
export interface AgentsMpUsageSummary {
  readonly turnCount: string;
  readonly inputTokens: string;
  readonly outputTokens: string;
}

export interface AgentsMpUsageService {
  loadSummary(): Promise<AgentsMpUsageSummary | null>;
}

export function createAgentsMpUsageService(
  client: SdkworkAgentsAppClient,
): AgentsMpUsageService {
  return {
    async loadSummary() {
      try {
        const summary = await getUsageSummary(client);
        return {
          turnCount: summary.turnCount,
          inputTokens: summary.inputTokens,
          outputTokens: summary.outputTokens,
        };
      } catch {
        return null;
      }
    },
  };
}
