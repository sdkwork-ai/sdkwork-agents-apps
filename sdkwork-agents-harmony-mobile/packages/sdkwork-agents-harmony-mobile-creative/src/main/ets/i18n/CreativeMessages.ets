import {
  type AgentsHarmonyMessageCatalog,
  mergeAgentsHarmonyCatalogs,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import { agentsLocalizedMessage } from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { agentsCreativeStudioEnUs } from './en-US/agents/creative/studio';
import { agentsCreativeStudioZhCn } from './zh-CN/agents/creative/studio';

/**
 * Package-local locale aggregation for the creative capability.
 *
 * Authority: `I18N_SPEC.md` section 6.1 — authored copy lives in
 * `<locale>/<domain>/<capability>/<screen>` fragments; this module only
 * aggregates and looks up.
 */
export const creativeMessagesEnUs: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsCreativeStudioEnUs]);

export const creativeMessagesZhCn: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsCreativeStudioZhCn]);

/** Resolves one creative message key in the active runtime locale. */
export function creativeMessage(key: string): string {
  return agentsLocalizedMessage(creativeMessagesZhCn, creativeMessagesEnUs, key);
}
