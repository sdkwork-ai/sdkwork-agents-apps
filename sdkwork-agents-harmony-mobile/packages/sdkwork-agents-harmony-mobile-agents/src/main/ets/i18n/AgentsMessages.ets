import {
  type AgentsHarmonyMessageCatalog,
  mergeAgentsHarmonyCatalogs,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import { agentsLocalizedMessage } from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { agentsCatalogListEnUs } from './en-US/agents/catalog/list';
import { agentsConversationChatEnUs } from './en-US/agents/conversation/chat';
import { agentsCatalogListZhCn } from './zh-CN/agents/catalog/list';
import { agentsConversationChatZhCn } from './zh-CN/agents/conversation/chat';

/**
 * Package-local locale aggregation for the agents capability.
 *
 * Authority: `I18N_SPEC.md` section 6.1 — authored copy lives in
 * `<locale>/<domain>/<capability>/<screen>` fragments; this module only
 * aggregates and looks up. Platform `resources/**/element/string.json` files are
 * projections and stay out of authored copy.
 */
export const agentsMessagesEnUs: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsCatalogListEnUs, agentsConversationChatEnUs]);

export const agentsMessagesZhCn: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsCatalogListZhCn, agentsConversationChatZhCn]);

/** Resolves one agents message key in the active runtime locale. */
export function agentsMessage(key: string): string {
  return agentsLocalizedMessage(agentsMessagesZhCn, agentsMessagesEnUs, key);
}
