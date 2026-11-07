/**
 * Generated backend-admin SDK boundary for the Agents module.
 *
 * The Agents admin block (`@sdkwork/agents-pc-admin`) is a capability package
 * and must not import the generated backend SDK directly. It receives its
 * client instance through `configureAgentsAdminRuntime({ getBackendSdkClient })`
 * from the composing host, so only the public request/record types and the
 * client contract belong here, next to the other Agents SDK boundaries.
 */
export type {
  AgentRecord,
  CreateAgentRequest,
  RestoreAgentRequest,
  SdkWorkPageData,
  SdkworkBackendClient,
  UpdateAgentRequest,
  UpdateAgentStatusRequest,
} from '@sdkwork/agents-backend-sdk';
