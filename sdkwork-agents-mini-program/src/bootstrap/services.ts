import {
  createAgentsMpAgentProvisioner,
  createAgentCatalogService,
  type AgentCatalogService,
} from "@sdkwork/agents-mp-agents";
import {
  createAgentsMpAutomationService,
  type AgentsMpAutomationAgentSource,
  type AgentsMpAutomationService,
} from "@sdkwork/agents-mp-automation";
import {
  createAgentsMpConversationService,
  type AgentsMpConversationService,
} from "@sdkwork/agents-mp-conversation";
import { getAgentsAppSdkClient, getDriveAppSdkClient } from "@sdkwork/agents-mp-core/sdk";
import {
  createAgentsMpLibraryService,
  type AgentsMpLibraryService,
} from "@sdkwork/agents-mp-library";
import {
  createAgentsMpProjectsService,
  type AgentsMpProjectsService,
} from "@sdkwork/agents-mp-projects";

/**
 * Capability service composition for the Agents mini program.
 *
 * This is the single place where capability packages are wired to the generated
 * app SDK clients; capability packages only ever receive an injected client or a
 * narrow port (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 5 and
 * section 8). Platform pages call these factories instead of constructing
 * transport themselves.
 */

interface AgentsMpRawAgentListRecord {
  readonly agentId?: string;
  readonly id?: string;
}

function createManagedAgentSource(client: ReturnType<typeof getAgentsAppSdkClient>): AgentsMpAutomationAgentSource {
  return {
    async listManagedAgentIds(limit) {
      const response = await client.ai.agents.list({
        scope: "mine",
        page: 1,
        pageSize: limit,
      });
      return (response.items as AgentsMpRawAgentListRecord[])
        .map((record) => record.agentId ?? record.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
    },
  };
}

export interface AgentsMpRuntimeServices {
  readonly catalog: AgentCatalogService;
  readonly conversation: AgentsMpConversationService;
  readonly library: AgentsMpLibraryService;
  readonly projects: AgentsMpProjectsService;
  readonly automation: AgentsMpAutomationService;
}

let cachedServices: AgentsMpRuntimeServices | null = null;

/**
 * Returns the session-scoped capability services.
 *
 * Services hold small caches (built-in assistant id, provisioned model,
 * automation aggregate), so pages must reuse one instance per session rather
 * than constructing a new one on every screen.
 */
export function getAgentsMpRuntimeServices(): AgentsMpRuntimeServices {
  if (!cachedServices) {
    cachedServices = createAgentsMpRuntimeServices();
  }
  return cachedServices;
}

/** Test-only reset for the session-scoped services. */
export function resetAgentsMpRuntimeServices(): void {
  cachedServices = null;
}

export function createAgentsMpRuntimeServices(): AgentsMpRuntimeServices {
  const client = getAgentsAppSdkClient();
  const driveClient = getDriveAppSdkClient();
  const provisioner = createAgentsMpAgentProvisioner(client);

  const conversation = createAgentsMpConversationService(client, {
    async ensureAgent(model) {
      const resolved = model ?? (await conversation.resolveDefaultModel());
      return provisioner.ensureBuiltInAssistant(resolved);
    },
    async updateAgentModel(agentId, model) {
      await provisioner.updateAssistantModel(agentId, model);
    },
  });

  return {
    catalog: createAgentCatalogService(client),
    conversation,
    library: createAgentsMpLibraryService(driveClient),
    projects: createAgentsMpProjectsService(client),
    automation: createAgentsMpAutomationService(client, createManagedAgentSource(client)),
  };
}
