/**
 * Route contributions for the agents capability.
 *
 * Route ids follow `<surface>.<domain>.<capability>.<screen>` and are aligned
 * with the PC and H5 roots. Route metadata must not declare HTTP API paths,
 * SDK methods, raw URL constants, or transport details.
 */
export interface AgentsRouteContribution {
  readonly id: string;
  readonly surface: 'app';
  readonly domain: string;
  readonly capability: string;
  readonly screen: string;
  readonly pagePath: string;
  readonly titleKey: string;
  readonly auth: 'public' | 'required';
  readonly permissionHint?: string;
}

export const agentsRouteContributions: AgentsRouteContribution[] = [
  {
    id: 'app.agents.catalog.list',
    surface: 'app',
    domain: 'agents',
    capability: 'catalog',
    screen: 'list',
    pagePath: 'pages/agents/AgentsList',
    titleKey: 'agents.catalog.title',
    auth: 'required',
    permissionHint: 'agents.agents.read',
  },
  {
    id: 'app.agents.catalog.detail',
    surface: 'app',
    domain: 'agents',
    capability: 'catalog',
    screen: 'detail',
    pagePath: 'pages/agents/AgentDetail',
    titleKey: 'agents.detail.title',
    auth: 'required',
    permissionHint: 'agents.agents.read',
  },
  {
    id: 'app.agents.catalog.create',
    surface: 'app',
    domain: 'agents',
    capability: 'catalog',
    screen: 'create',
    pagePath: 'pages/agents/CreateAgent',
    titleKey: 'agents.create.title',
    auth: 'required',
    permissionHint: 'agents.agents.write',
  },
  {
    id: 'app.agents.conversation.chat',
    surface: 'app',
    domain: 'agents',
    capability: 'conversation',
    screen: 'chat',
    pagePath: 'pages/agents/AgentConversation',
    titleKey: 'agents.conversation.title',
    auth: 'required',
    permissionHint: 'agents.agents.read',
  },
];
