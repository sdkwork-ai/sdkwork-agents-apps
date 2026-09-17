/**
 * Thin i18n aggregation for the agents mini program capability package.
 *
 * Authority: `I18N_SPEC.md` section 6.1. `src/i18n/index.ts` may import and
 * re-export authored fragments; it MUST NOT author feature copy itself. Keys live
 * in `zh-CN/agents/catalog/list.ts` and `en-US/agents/catalog/list.ts`.
 */
import { agentsMpCatalogListEnUs } from "./en-US/agents/catalog/list";
import { agentsMpCatalogListZhCn } from "./zh-CN/agents/catalog/list";

export { agentsMpCatalogListEnUs, agentsMpCatalogListZhCn };

/** Locale-keyed view of the agents catalog fragments. */
export const agentsMpCatalogFragments: Record<string, Record<string, string>> = {
  "en-US": agentsMpCatalogListEnUs,
  "zh-CN": agentsMpCatalogListZhCn,
};
