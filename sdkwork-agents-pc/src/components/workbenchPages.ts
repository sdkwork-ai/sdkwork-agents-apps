/**
 * Canonical page identities for the Agents client family.
 *
 * The PC workbench is the reference surface for every other client root. Each
 * surface it renders is named with the cross-client route identity from
 * `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7
 * (`<surface>.<domain>.<capability>.<screen>`) even though PC navigation is
 * tab state rather than a URL router.
 *
 * Authority: `specs/client-page-parity.spec.json` (page inventory and per-client
 * presentation) and `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7.
 */

import type { WorkbenchTab } from './workbenchTabs';

/** Page ids owned by the Agents application (`app.agents.*`). */
export const AGENTS_PAGE_IDS = {
  conversationChat: 'app.agents.conversation.chat',
  conversationList: 'app.agents.conversation.list',
  catalogList: 'app.agents.catalog.list',
  catalogEditor: 'app.agents.catalog.editor',
  inspirationDiscover: 'app.agents.inspiration.discover',
  creativeStudio: 'app.agents.creative.studio',
  assetsList: 'app.agents.assets.list',
  assetsDetail: 'app.agents.assets.detail',
  canvasBoard: 'app.agents.canvas.board',
  membershipCatalog: 'app.agents.membership.catalog',
  profileIndex: 'app.agents.profile.index',
  settingsIndex: 'app.agents.settings.index',
  projectsList: 'app.agents.projects.list',
  libraryList: 'app.agents.library.list',
  automationIndex: 'app.agents.automation.index',
} as const;

export type AgentsPageId = typeof AGENTS_PAGE_IDS[keyof typeof AGENTS_PAGE_IDS];

/** Page rendered by each PC workbench tab. */
export const WORKBENCH_PAGE_BY_TAB: Record<WorkbenchTab, AgentsPageId> = {
  chat_session: AGENTS_PAGE_IDS.conversationChat,
  agents: AGENTS_PAGE_IDS.catalogList,
  inspiration: AGENTS_PAGE_IDS.inspirationDiscover,
  creative: AGENTS_PAGE_IDS.creativeStudio,
  assets: AGENTS_PAGE_IDS.assetsList,
  canvas: AGENTS_PAGE_IDS.canvasBoard,
};

/**
 * PC surfaces that are not workbench tabs.
 *
 * They still own a canonical page id so a mobile root can implement the same
 * page without inventing a second identity.
 */
export const WORKBENCH_AUXILIARY_PAGES = {
  membership: AGENTS_PAGE_IDS.membershipCatalog,
  profile: AGENTS_PAGE_IDS.profileIndex,
  settings: AGENTS_PAGE_IDS.settingsIndex,
  projects: AGENTS_PAGE_IDS.projectsList,
  library: AGENTS_PAGE_IDS.libraryList,
  conversationList: AGENTS_PAGE_IDS.conversationList,
  catalogEditor: AGENTS_PAGE_IDS.catalogEditor,
  assetsDetail: AGENTS_PAGE_IDS.assetsDetail,
} as const;

/** Every page identity the PC reference surface declares. */
export const PC_DECLARED_PAGE_IDS: readonly AgentsPageId[] = [
  ...Object.values(WORKBENCH_PAGE_BY_TAB),
  ...Object.values(WORKBENCH_AUXILIARY_PAGES),
];

/** Resolves the page id a workbench tab renders. */
export function resolvePageIdForWorkbenchTab(tab: WorkbenchTab): AgentsPageId {
  return WORKBENCH_PAGE_BY_TAB[tab];
}
