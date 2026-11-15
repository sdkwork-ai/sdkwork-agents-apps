/**
 * Reusable agent creation and editor surface.
 *
 * Hosts import from `@sdkwork/agents-pc-agents/editor` when they embed only the
 * creation flow: the basic-information dialog, the local archive upload, and
 * the conversation editor are one cohesive unit and must not be re-implemented
 * per console. The console, the admin surface and the standalone app mount this
 * entry with their own navigation and transport overrides.
 */

export { AgentBasicInfoDialog, type AgentBasicInfoDialogProps } from './AgentBasicInfoDialog';
export { AgentPackageUpload, type AgentPackageUploadProps } from './AgentPackageUpload';
export { AgentCreationFlow, type AgentCreationFlowProps } from './AgentCreationFlow';
export {
  EMPTY_AGENT_BASICS,
  agentKindLabel,
  buildAgentConfigFromBasics,
  requiresPackageUpload,
  type AgentAvatarSubmission,
  type AgentBasicsDraft,
  type AgentCreationBaseConfig,
  type AgentCreationServices,
} from './agentCreationModel';
export {
  AGENT_CATEGORY_TAXONOMY,
  agentCategoryLabel,
  isAgentCategoryCode,
  listAgentCategoryLeaves,
  type AgentCategoryLeaf,
  type AgentCategoryNode,
} from '../services/agentTaxonomy';
export {
  CONVERSATION_RUNTIME,
  DEFAULT_LOCAL_AGENT_ENGINE_ID,
  HARNESS_RUNTIME_PROTOCOL,
  LOCAL_AGENT_ENGINES,
  buildConversationRuntime,
  buildLocalArchiveDistribution,
  buildLocalExecutionRuntime,
  findLocalAgentEngine,
  isAgentArchiveDistribution,
  type AgentArchiveDistribution,
  type AgentDistribution,
  type AgentKind,
  type AgentRuntimeDescriptor,
  type LocalAgentEngine,
} from '../services/agentRuntimeCatalog';
export { CreateAgentView } from '../pages/CreateAgentView';
export type {
  CreateAgentCapability,
  CreateAgentViewProps,
} from '../pages/CreateAgentView';
