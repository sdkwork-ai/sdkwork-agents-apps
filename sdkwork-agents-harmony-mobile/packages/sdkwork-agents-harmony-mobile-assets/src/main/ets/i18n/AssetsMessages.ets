import {
  type AgentsHarmonyMessageCatalog,
  mergeAgentsHarmonyCatalogs,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import { agentsLocalizedMessage } from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { agentsAssetsListEnUs } from './en-US/agents/assets/list';
import { agentsAssetsListZhCn } from './zh-CN/agents/assets/list';

/**
 * Package-local locale aggregation for the assets capability.
 *
 * Authority: `I18N_SPEC.md` section 6.1 — authored copy lives in
 * `<locale>/<domain>/<capability>/<screen>` fragments; this module only
 * aggregates and looks up.
 */
export const assetsMessagesEnUs: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsAssetsListEnUs]);

export const assetsMessagesZhCn: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsAssetsListZhCn]);

/** Resolves one assets message key in the active runtime locale. */
export function assetsMessage(key: string): string {
  return agentsLocalizedMessage(assetsMessagesZhCn, assetsMessagesEnUs, key);
}
