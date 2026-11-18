/**
 * Curated create-flow export surface.
 *
 * Hosts that embed only the agent creation flow (basic-info dialog and the
 * agent editor) import from here instead of the root barrel: the barrel also
 * carries the chat and home surfaces (`AgentChatView`, `AgentsHomePage`,
 * `agentChatService`), whose module graph reaches the chat transport and the
 * Monaco loader, and a bundler that must keep a barrel's top-level
 * instantiations cannot drop them. This entry keeps the embedded closure to
 * the creation surface and the knowledge-selection binding it configures.
 */
export { CreateAgentModal } from "./components/CreateAgentModal";
export { AgentCreationFlow } from "./editor/AgentCreationFlow";
export { AgentBasicInfoDialog } from "./editor/AgentBasicInfoDialog";
export { AgentPackageUpload } from "./editor/AgentPackageUpload";
export { CreateAgentView, AgentEditorView } from "./pages/CreateAgentView";
export type {
  CreateAgentCapability,
  CreateAgentViewProps,
  AgentEditorViewProps,
} from "./pages/CreateAgentView";
export { configureKnowledgeSelectionAdapter } from "./services/knowledgeSelectionAdapter";
export { createKnowledgebaseSelectionAdapter } from "./services/createKnowledgebaseSelectionAdapter";
