/**
 * Shell tab labels and navigation copy for the Agents HarmonyOS mobile shell.
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>` — locale -> domain -> capability ->
 * screen fragment. The file is authored copy for the shell fragment only.
 *
 * Keys follow `specs/client-page-parity.spec.json` `pages[].titleKey` for the
 * contract-declared page titles, so title keys stay aligned across clients.
 */
export const agentsShellTabsEnUs: Record<string, string> = {
  'agents.mobile.tab.tasks': 'Chat',
  'agents.mobile.tab.experts': 'Agents',
  'agents.mobile.tab.inspiration': 'Inspiration',
  'agents.mobile.tab.creative': 'Create',
  'agents.mobile.tab.assets': 'Assets',
  'agents.mobile.tab.membership': 'Membership',
  'agents.mobile.tab.profile': 'Profile',
  'agents.mobile.tab.library': 'Library',
  'agents.mobile.tab.projects': 'Projects',
  'agents.mobile.tab.automation': 'Automation',
  'agents.mobile.tab.settings': 'Settings',
  'agents.mobile.tab.canvas': 'Canvas',
  'agents.mobile.tab.createAgent': 'Create agent',
  'agents.mobile.history.title': 'Conversation history',
  'agents.mobile.assets.detailTitle': 'Asset detail',
  'agents.shell.profileAction': 'Profile',
  'agents.shell.profileActionGlyph': 'Me',
  'agents.shell.tab.selected': 'selected',
  'agents.shell.tab.unselected': 'not selected',
  'agents.shell.navigation.notDelivered': 'This surface is not available in this client yet.',
  'agents.shell.navigation.retry': 'Retry',
};
