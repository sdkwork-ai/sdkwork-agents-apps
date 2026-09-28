//! `@sdkwork/agents-pc-agents/console` — the Agents user-console entry.
//!
//! Hosts embed `AgentsConsoleEmbed` and inject their SDK clients once through
//! `configureAgentsConsoleRuntime`. Everything console-related composes here
//! (module catalog, management page, editor, styles) so a host never has to know
//! which internal page a module renders — reaching into `pages/*` from another
//! repository would break the moment this package reorganises.

export {
  AgentsConsoleEmbed,
  type AgentsConsoleEmbedProps,
  type AgentsConsoleNavigationTarget,
} from './console/AgentsConsoleEmbed';
export {
  agentsConsoleModules,
  AGENTS_CONSOLE_MODULE_IDS,
  DEFAULT_AGENTS_CONSOLE_MODULE_ID,
  findAgentsConsoleModuleById,
  findAgentsConsoleModuleByRoute,
  type AgentsConsoleModule,
  type AgentsConsoleModuleId,
} from './console/consoleModules';
export {
  configureAgentsConsoleRuntime,
  initializeAgentsConsoleKnowledgebaseRuntime,
  type AgentsConsoleRequiredClients,
  type AgentsConsoleRuntime,
} from './console/consoleRuntime';
export type { CreateAgentCapability } from './pages/CreateAgentView';
