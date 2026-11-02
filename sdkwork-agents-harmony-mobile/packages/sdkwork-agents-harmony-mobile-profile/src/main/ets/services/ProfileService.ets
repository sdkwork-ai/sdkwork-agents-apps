import {
  readAgentsHarmonySession,
  readyAgentsPageSnapshot,
  unauthenticatedAgentsPageSnapshot,
  type AgentsHarmonySession,
  type AgentsPageSnapshot,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';
import {
  AGENTS_HARMONY_PROFILE_LINK_ROUTE_IDS,
  AUTOMATION_INDEX_ROUTE_ID,
  CONVERSATION_LIST_ROUTE_ID,
  LIBRARY_LIST_ROUTE_ID,
  MEMBERSHIP_CATALOG_ROUTE_ID,
  PROJECTS_LIST_ROUTE_ID,
  SETTINGS_INDEX_ROUTE_ID,
} from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { type ProfileLink, type ProfileSummary } from '../models/ProfileModels';

/**
 * Profile hub use cases.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 4. The summary is the real
 * core session state (no fabricated display name or avatar); links come from the
 * shell's canonical profile-link route ids so the hub cannot drift from the
 * parity contract.
 */
export class ProfileService {
  async loadSummary(): Promise<AgentsPageSnapshot<ProfileSummary>> {
    const session: AgentsHarmonySession | null = readAgentsHarmonySession();
    if (session === null) {
      return unauthenticatedAgentsPageSnapshot<ProfileSummary>('agents.profile.signInRequired');
    }
    const summary: ProfileSummary = {
      authenticated: true,
      tenantId: session.tenantId === undefined ? '' : session.tenantId,
    };
    return readyAgentsPageSnapshot<ProfileSummary>([summary]);
  }

  /** Profile-hub links in contract order, with package-owned label keys. */
  links(): ProfileLink[] {
    const labels: Map<string, string> = new Map<string, string>();
    labels.set(MEMBERSHIP_CATALOG_ROUTE_ID, 'agents.profile.link.membership');
    labels.set(PROJECTS_LIST_ROUTE_ID, 'agents.profile.link.projects');
    labels.set(LIBRARY_LIST_ROUTE_ID, 'agents.profile.link.library');
    labels.set(AUTOMATION_INDEX_ROUTE_ID, 'agents.profile.link.automation');
    labels.set(CONVERSATION_LIST_ROUTE_ID, 'agents.profile.link.history');
    labels.set(SETTINGS_INDEX_ROUTE_ID, 'agents.profile.link.settings');

    const links: ProfileLink[] = [];
    for (const routeId of AGENTS_HARMONY_PROFILE_LINK_ROUTE_IDS) {
      const labelKey: string | undefined = labels.get(routeId);
      if (labelKey !== undefined) {
        links.push({ routeId, labelKey });
      }
    }
    return links;
  }
}
