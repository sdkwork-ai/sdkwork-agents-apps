/**
 * Profile-hub links for the H5 root.
 *
 * The hub is the only mobile route to the secondary PC surfaces, so the link set
 * is shell-owned navigation metadata (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md`
 * sections 4 and 7). Presentation is delegated to the profile capability.
 */

import {
  AUTOMATION_PATH,
  CONVERSATION_LIST_PATH,
  LIBRARY_PATH,
  MEMBERSHIP_PATH,
  PROJECTS_PATH,
  SETTINGS_PATH,
} from "./routeRegistry";

export interface AgentsH5ProfileLinkDescriptor {
  readonly id: string;
  readonly labelKey: string;
  readonly path: string;
}

export const AGENTS_H5_PROFILE_LINKS: readonly AgentsH5ProfileLinkDescriptor[] = [
  {
    id: "membership",
    labelKey: "agents.mobile.tab.membership",
    path: MEMBERSHIP_PATH,
  },
  {
    id: "projects",
    labelKey: "agents.mobile.tab.projects",
    path: PROJECTS_PATH,
  },
  {
    id: "library",
    labelKey: "agents.mobile.tab.library",
    path: LIBRARY_PATH,
  },
  {
    id: "automation",
    labelKey: "agents.mobile.tab.automation",
    path: AUTOMATION_PATH,
  },
  {
    id: "conversation-history",
    labelKey: "agents.mobile.history.title",
    path: CONVERSATION_LIST_PATH,
  },
  {
    id: "settings",
    labelKey: "agents.mobile.tab.settings",
    path: SETTINGS_PATH,
  },
];

/** Resolves a profile link by id, or `undefined` when it is not exposed. */
export function resolveAgentsH5ProfileLink(
  id: string,
): AgentsH5ProfileLinkDescriptor | undefined {
  return AGENTS_H5_PROFILE_LINKS.find((link) => link.id === id);
}
