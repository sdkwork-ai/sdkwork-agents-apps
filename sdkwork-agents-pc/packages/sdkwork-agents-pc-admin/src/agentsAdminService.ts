import type {
  AgentRecord,
  CreateAgentRequest,
  RestoreAgentRequest,
  SdkWorkPageData,
  SdkworkBackendClient,
  UpdateAgentRequest,
  UpdateAgentStatusRequest,
} from '@sdkwork/agents-pc-core/sdk/agentsBackendSdkClient';

/**
 * List query parameters of the generated backend client. The generated API
 * barrel does not re-export the `*ListParams` interfaces, so the type is
 * derived from the client method signature it parameterizes.
 */
export type AgentsAdminListParams = Parameters<
  SdkworkBackendClient['ai']['agents']['list']
>[0];

export type {
  AgentRecord,
  CreateAgentRequest,
  RestoreAgentRequest,
  UpdateAgentRequest,
  UpdateAgentStatusRequest,
};

/**
 * Runtime ports the Agents admin block needs from its composing host.
 *
 * The admin block never constructs transport itself: the host binds a backend
 * client factory (same-origin base URL, host session token manager) through
 * {@link configureAgentsAdminRuntime} before the first render, mirroring the
 * `configureAgentsConsoleRuntime` seam used by the Agents console embed.
 */
export interface AgentsAdminRuntime {
  getBackendSdkClient: () => SdkworkBackendClient;
}

let runtime: AgentsAdminRuntime | null = null;

export function configureAgentsAdminRuntime(next: AgentsAdminRuntime): void {
  runtime = next;
}

export function getAgentsAdminBackendSdkClient(): SdkworkBackendClient {
  if (!runtime) {
    throw new Error(
      'Agents admin runtime is not configured: call configureAgentsAdminRuntime({ getBackendSdkClient }) before rendering AgentsAdminPage',
    );
  }
  return runtime.getBackendSdkClient();
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function listManagedAgents(
  params?: AgentsAdminListParams,
): Promise<SdkWorkPageData & { items: AgentRecord[] }> {
  return getAgentsAdminBackendSdkClient().ai.agents.list(params);
}

export async function createManagedAgent(
  body: Omit<CreateAgentRequest, 'requestedAt'>,
): Promise<AgentRecord> {
  return getAgentsAdminBackendSdkClient().ai.agents.create({ ...body, requestedAt: nowIso() });
}

export async function retrieveManagedAgent(agentId: string): Promise<AgentRecord> {
  return getAgentsAdminBackendSdkClient().ai.agents.retrieve(agentId);
}

export async function updateManagedAgent(
  agentId: string,
  body: Omit<UpdateAgentRequest, 'requestedAt'>,
): Promise<AgentRecord> {
  return getAgentsAdminBackendSdkClient().ai.agents.update(agentId, { ...body, requestedAt: nowIso() });
}

export async function updateManagedAgentStatus(
  agentId: string,
  targetStatus: UpdateAgentStatusRequest['targetStatus'],
  expectedVersion?: string,
): Promise<AgentRecord> {
  return getAgentsAdminBackendSdkClient().ai.agents.status.create(agentId, {
    targetStatus,
    ...(expectedVersion !== undefined ? { expectedVersion } : {}),
    requestedAt: nowIso(),
  });
}

export async function restoreManagedAgent(
  agentId: string,
  expectedVersion?: string,
): Promise<AgentRecord> {
  const body: RestoreAgentRequest = {
    ...(expectedVersion !== undefined ? { expectedVersion } : {}),
    requestedAt: nowIso(),
  };
  return getAgentsAdminBackendSdkClient().ai.agents.restore(agentId, body);
}
