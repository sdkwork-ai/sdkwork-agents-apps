import {
  type AgentsHarmonyMessageCatalog,
  mergeAgentsHarmonyCatalogs,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import { agentsLocalizedMessage } from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { agentsInspirationDiscoverEnUs } from './en-US/agents/inspiration/discover';
import { agentsInspirationDiscoverZhCn } from './zh-CN/agents/inspiration/discover';

/**
 * Package-local locale aggregation for the inspiration capability.
 *
 * Authority: `I18N_SPEC.md` section 6.1 — authored copy lives in
 * `<locale>/<domain>/<capability>/<screen>` fragments; this module only
 * aggregates and looks up.
 */
export const inspirationMessagesEnUs: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsInspirationDiscoverEnUs]);

export const inspirationMessagesZhCn: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsInspirationDiscoverZhCn]);

/** Resolves one inspiration message key in the active runtime locale. */
export function inspirationMessage(key: string): string {
  return agentsLocalizedMessage(inspirationMessagesZhCn, inspirationMessagesEnUs, key);
}
