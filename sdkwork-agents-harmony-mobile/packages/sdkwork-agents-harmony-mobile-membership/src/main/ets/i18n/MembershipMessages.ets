import {
  type AgentsHarmonyMessageCatalog,
  mergeAgentsHarmonyCatalogs,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import { agentsLocalizedMessage } from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { agentsMembershipCatalogEnUs } from './en-US/agents/membership/catalog';
import { agentsMembershipCatalogZhCn } from './zh-CN/agents/membership/catalog';

/**
 * Package-local locale aggregation for the membership capability.
 *
 * Authority: `I18N_SPEC.md` section 6.1 — authored copy lives in
 * `<locale>/<domain>/<capability>/<screen>` fragments; this module only
 * aggregates and looks up.
 */
export const membershipMessagesEnUs: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsMembershipCatalogEnUs]);

export const membershipMessagesZhCn: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsMembershipCatalogZhCn]);

/** Resolves one membership message key in the active runtime locale. */
export function membershipMessage(key: string): string {
  return agentsLocalizedMessage(membershipMessagesZhCn, membershipMessagesEnUs, key);
}
