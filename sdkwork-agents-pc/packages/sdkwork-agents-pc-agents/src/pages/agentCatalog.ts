import type { AgentConfig } from '../services/AgentService';
import { listAgentCategoryLeaves } from '../services/agentTaxonomy';

/**
 * Market filters use the professional domain level of the agent taxonomy.
 *
 * A domain filter matches every agent whose leaf category belongs to that
 * domain, so the filter keeps working when a new specialty is seeded without
 * changing this list. The ids mirror `AGENT_CATEGORY_TAXONOMY` domains
 * (`specs/AGENTS_AGENT_KIND_AND_RUNTIME_SPEC.md` section 5).
 */
export const AGENT_MARKET_CATEGORIES = [
  { id: 'all', label: '全部 Agent' },
  { id: 'technology', label: '技术与工程' },
  { id: 'business', label: '商业与增长' },
  { id: 'corporate', label: '企业职能' },
  { id: 'education', label: '教育培训' },
  { id: 'health', label: '健康与福祉' },
  { id: 'public-service', label: '公共服务' },
  { id: 'lifestyle', label: '生活服务' },
  { id: 'content', label: '内容与媒体' },
  { id: 'industrial', label: '制造与供应链' },
] as const;

export type AgentMarketCategoryId = typeof AGENT_MARKET_CATEGORIES[number]['id'];

const DOMAIN_BY_LEAF = new Map(
  listAgentCategoryLeaves().map((leaf) => [leaf.code, leaf.parentCode]),
);

export function filterMarketAgents(
  agents: readonly AgentConfig[],
  categoryId: AgentMarketCategoryId,
): AgentConfig[] {
  if (categoryId === 'all') {
    return [...agents];
  }
  return agents.filter((agent) => {
    const code = agent.categoryId;
    if (!code) {
      return false;
    }
    // An agent may reference a domain directly (legacy or admin-authored
    // records) or a leaf under it; both select under the domain filter.
    return code === categoryId || DOMAIN_BY_LEAF.get(code) === categoryId;
  });
}
