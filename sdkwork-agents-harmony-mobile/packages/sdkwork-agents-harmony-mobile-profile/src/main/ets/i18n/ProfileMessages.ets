import {
  type AgentsHarmonyMessageCatalog,
  mergeAgentsHarmonyCatalogs,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import { agentsLocalizedMessage } from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { agentsProfileIndexEnUs } from './en-US/agents/profile/index';
import { agentsSettingsIndexEnUs } from './en-US/agents/settings/index';
import { agentsProfileIndexZhCn } from './zh-CN/agents/profile/index';
import { agentsSettingsIndexZhCn } from './zh-CN/agents/settings/index';

/**
 * Package-local locale aggregation for the profile capability.
 *
 * Authority: `I18N_SPEC.md` section 6.1 — authored copy lives in
 * `<locale>/<domain>/<capability>/<screen>` fragments; this module only
 * aggregates and looks up.
 */
export const profileMessagesEnUs: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsProfileIndexEnUs, agentsSettingsIndexEnUs]);

export const profileMessagesZhCn: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsProfileIndexZhCn, agentsSettingsIndexZhCn]);

/** Resolves one profile message key in the active runtime locale. */
export function profileMessage(key: string): string {
  return agentsLocalizedMessage(profileMessagesZhCn, profileMessagesEnUs, key);
}
