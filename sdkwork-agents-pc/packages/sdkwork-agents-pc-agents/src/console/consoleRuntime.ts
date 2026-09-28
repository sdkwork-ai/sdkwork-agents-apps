import type { SdkworkAgentsAppClient } from '@sdkwork/agents-pc-core/sdk/agentsAppSdkClient';
import type { SdkworkAgentsAssetsAppClient } from '@sdkwork/agents-pc-core/sdk/assetsAppSdkClient';
import type { SdkworkAgentsDriveAppClient } from '@sdkwork/agents-pc-core/sdk/driveAppSdkClient';
import {
  initKnowledgebaseAppSdkClient,
  isKnowledgebaseAppSdkConfigured,
} from '@sdkwork/agents-pc-core/sdk/knowledgebaseAppSdkClient';
import {
  configureSkillsAppSdkClientProvider,
  type SdkworkSkillsAppClient,
} from '@sdkwork/agents-pc-core/sdk/skillsAppSdkClient';

import { createKnowledgebaseSelectionAdapter } from '../services/createKnowledgebaseSelectionAdapter';
import { configureKnowledgeSelectionAdapter } from '../services/knowledgeSelectionAdapter';
import { configureAgentsHomeRuntime, type AgentsHomeRuntime } from '../services/AgentsHomeRuntime';

/**
 * Host bindings the Agents console needs.
 *
 * Exactly the subset the console renders: the agent catalog and its assets/drive
 * backing, plus the skills catalog the editor binds. The conversation stack
 * (chat, memory, prompts, feeds, generations, community, token plan) is
 * deliberately absent — a host that already offers agent conversations surfaces
 * them elsewhere, and the console hides its conversation entry point, so binding
 * that stack here would only add dead configuration surface.
 */
export interface AgentsConsoleRuntime extends AgentsHomeRuntime {
  /** Skills catalog shown by the editor's extended-capability section. */
  getSkillsAppSdkClient?: () => SdkworkSkillsAppClient;
}

/**
 * Wires the Agents console to its host.
 *
 * Call once per host before rendering `AgentsConsoleEmbed`. Only
 * {@link AgentsHomeRuntime} is mandatory: the agent catalog cannot render without
 * it, and failing loudly at configuration time is better than a blank page. Every
 * optional client degrades on its own — the panel that needs it reports an
 * unavailable catalog instead of breaking the whole console.
 */
export function configureAgentsConsoleRuntime(runtime: AgentsConsoleRuntime): void {
  configureAgentsHomeRuntime(runtime);
  if (runtime.getSkillsAppSdkClient) {
    configureSkillsAppSdkClientProvider(runtime.getSkillsAppSdkClient);
  }
  initializeAgentsConsoleKnowledgebaseRuntime();
}

/** Host-visible declaration of the two client getters every console host must pass. */
export type AgentsConsoleRequiredClients = Pick<
  AgentsHomeRuntime,
  'getAgentsAppSdkClient' | 'getAssetsAppSdkClient' | 'getDriveAppSdkClient'
>;

/**
 * Activates the knowledgebase-backed catalog when the deployment serves it.
 *
 * The console initializes this itself rather than requiring every host to repeat
 * the wiring: the knowledgebase client resolves its base URL from the agents
 * app-api origin, so in a deployment that composes the knowledgebase app-api the
 * editor's knowledge panel works with no extra host code, and in one that does
 * not (the panel is then hidden via `hiddenCapabilities`) the guard makes this a
 * no-op instead of a failed request.
 */
export function initializeAgentsConsoleKnowledgebaseRuntime(): void {
  if (!isKnowledgebaseAppSdkConfigured()) {
    return;
  }
  configureKnowledgeSelectionAdapter(
    createKnowledgebaseSelectionAdapter(initKnowledgebaseAppSdkClient()),
  );
}

export type { SdkworkAgentsAppClient, SdkworkAgentsAssetsAppClient, SdkworkAgentsDriveAppClient };
