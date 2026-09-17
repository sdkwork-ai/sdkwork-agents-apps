/**
 * Package-local locale fragments.
 *
 * Authority: `I18N_SPEC.md` section 6.1 — split by locale, domain, capability,
 * and screen fragment. Platform monolithic resources are assembled from these
 * fragments and must not be hand-authored as a whole-root catalog.
 */
export const agentsMessagesEnUs: Record<string, string> = {
  'agents.catalog.title': 'Agents',
  'agents.detail.title': 'Agent',
  'agents.create.title': 'Create Agent',
  'agents.conversation.title': 'Conversation',
  'agents.catalog.empty': 'No agents yet',
  'agents.catalog.loadFailed': 'Failed to load agents',
};

export const agentsMessagesZhCn: Record<string, string> = {
  'agents.catalog.title': '智能体',
  'agents.detail.title': '智能体详情',
  'agents.create.title': '创建智能体',
  'agents.conversation.title': '对话',
  'agents.catalog.empty': '暂无智能体',
  'agents.catalog.loadFailed': '智能体加载失败',
};
