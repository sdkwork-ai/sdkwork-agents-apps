import { type AgentsHarmonyRouteRegistration } from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

/**
 * Route contributions for the SDKWork Agents HarmonyOS mobile root.
 *
 * Authority: `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 8 (route
 * contributions declare id, surface, domain, capability, screen, titleKey, auth,
 * and permission hints) and
 * `specs/client-page-parity.spec.json` (`clients.harmony.registry` declares
 * exactly this file).
 *
 * This file is the contract-declared registry for the root, so it carries the
 * complete page inventory in one place. Route ids are literals: the parity sweep
 * reads source text, and an id assembled from fragments would hide a gap. The
 * typed constants in
 * `packages/sdkwork-agents-harmony-mobile-shell/src/main/ets/navigation/RouteIds.ets`
 * must stay byte-identical; `tests/harmony-surface-contract.test.mjs` compares
 * the two sets.
 *
 * Route metadata must not declare HTTP API paths, SDK methods, raw URL
 * constants, or transport details.
 */

/** Route contribution shape for this root (shared shell contract). */
export type AgentsRouteContribution = AgentsHarmonyRouteRegistration;

export const agentsRouteContributions: AgentsHarmonyRouteRegistration[] = [
  // --- M1: PC-primary surfaces ---------------------------------------------
  {
    id: 'app.agents.conversation.chat',
    surface: 'app',
    domain: 'agents',
    capability: 'conversation',
    screen: 'chat',
    pagePath: 'pages/agents/AgentConversation',
    titleKey: 'agents.mobile.tab.tasks',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'tab',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.catalog.list',
    surface: 'app',
    domain: 'agents',
    capability: 'catalog',
    screen: 'list',
    pagePath: 'pages/agents/AgentsList',
    titleKey: 'agents.mobile.tab.experts',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'tab',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.inspiration.discover',
    surface: 'app',
    domain: 'agents',
    capability: 'inspiration',
    screen: 'discover',
    pagePath: 'pages/inspiration/InspirationPage',
    titleKey: 'agents.mobile.tab.inspiration',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'tab',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.creative.studio',
    surface: 'app',
    domain: 'agents',
    capability: 'creative',
    screen: 'studio',
    pagePath: 'pages/creative/CreativePage',
    titleKey: 'agents.mobile.tab.creative',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'tab',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.assets.list',
    surface: 'app',
    domain: 'agents',
    capability: 'assets',
    screen: 'list',
    pagePath: 'pages/assets/AssetsPage',
    titleKey: 'agents.mobile.tab.assets',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'tab',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.membership.catalog',
    surface: 'app',
    domain: 'agents',
    capability: 'membership',
    screen: 'catalog',
    pagePath: 'pages/membership/MembershipPage',
    titleKey: 'agents.mobile.tab.membership',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'page',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.profile.index',
    surface: 'app',
    domain: 'agents',
    capability: 'profile',
    screen: 'index',
    pagePath: 'pages/profile/ProfilePage',
    titleKey: 'agents.mobile.tab.profile',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'page',
    pageStatus: 'delivered',
  },

  // --- M2: secondary and nested surfaces -----------------------------------
  {
    id: 'app.agents.conversation.list',
    surface: 'app',
    domain: 'agents',
    capability: 'conversation',
    screen: 'list',
    pagePath: 'pages/conversation/ConversationHistory',
    titleKey: 'agents.mobile.history.title',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'page',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.catalog.editor',
    surface: 'app',
    domain: 'agents',
    capability: 'catalog',
    screen: 'editor',
    pagePath: 'pages/agents/CreateAgent',
    titleKey: 'agents.mobile.tab.createAgent',
    auth: 'required',
    permissionHint: 'ai.agents.manage',
    presentation: 'page',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.assets.detail',
    surface: 'app',
    domain: 'agents',
    capability: 'assets',
    screen: 'detail',
    pagePath: 'pages/assets/AssetDetailPage',
    titleKey: 'agents.mobile.assets.detailTitle',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'sheet',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.canvas.board',
    surface: 'app',
    domain: 'agents',
    capability: 'canvas',
    screen: 'board',
    pagePath: 'pages/canvas/CanvasPage',
    titleKey: 'agents.mobile.tab.canvas',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'page',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.projects.list',
    surface: 'app',
    domain: 'agents',
    capability: 'projects',
    screen: 'list',
    pagePath: 'pages/projects/ProjectsPage',
    titleKey: 'agents.mobile.tab.projects',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'page',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.library.list',
    surface: 'app',
    domain: 'agents',
    capability: 'library',
    screen: 'list',
    pagePath: 'pages/library/LibraryPage',
    titleKey: 'agents.mobile.tab.library',
    auth: 'required',
    permissionHint: 'drive.nodes.read',
    presentation: 'page',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.settings.index',
    surface: 'app',
    domain: 'agents',
    capability: 'settings',
    screen: 'index',
    pagePath: 'pages/settings/SettingsPage',
    titleKey: 'agents.mobile.tab.settings',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'page',
    pageStatus: 'delivered',
  },
  {
    id: 'app.agents.automation.index',
    surface: 'app',
    domain: 'agents',
    capability: 'automation',
    screen: 'index',
    pagePath: 'pages/automation/AutomationPage',
    titleKey: 'agents.mobile.tab.automation',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    presentation: 'page',
    pageStatus: 'delivered',
  },
];

/** Route ids whose screens are mounted in this milestone. */
export function deliveredAgentsRouteContributions(): AgentsHarmonyRouteRegistration[] {
  return agentsRouteContributions.filter(
    (route: AgentsHarmonyRouteRegistration) => route.pageStatus === 'delivered',
  );
}
