import { useEffect, useState } from 'react';

/**
 * Local copy bundle for the managed-agent administration block.
 *
 * The block is mounted by several hosts, so it carries its own English and
 * Chinese copy instead of depending on host-specific translation keys. The
 * language is read from the host document language (`<html lang>`), which both
 * the Cloud Router admin shell and the Agents shell keep in sync with their
 * i18n instance.
 */
const en = {
  title: 'Agent management',
  description: 'Managed agents served through the backend administration API.',
  actions: {
    newAgent: 'New agent',
  },
  table: {
    agent: 'Agent',
    code: 'Code',
    implementation: 'Implementation',
    category: 'Category',
    visibility: 'Visibility',
    status: 'Status',
    version: 'Version',
    updated: 'Updated',
    actions: 'Actions',
    uncategorized: 'Uncategorized',
    edit: 'Edit',
    loading: 'Loading agents…',
    empty: 'No managed agents yet',
  },
  status: {
    draft: 'Draft',
    active: 'Active',
    disabled: 'Disabled',
    archived: 'Archived',
    deleted: 'Deleted',
  },
  visibility: {
    private: 'Private',
    organization: 'Organization',
    tenant: 'Tenant',
    public: 'Public',
  },
  transitions: {
    activate: 'Activate',
    archive: 'Archive',
    disable: 'Disable',
    restore: 'Restore record',
  },
  notices: {
    created: 'Agent created.',
    updated: (name: string) => `Agent ${name} updated.`,
    restored: (name: string) => `Agent ${name} restored.`,
    statusChanged: (name: string, status: string) => `Agent ${name} is now ${status}.`,
  },
  errors: {
    requestFailed: (message: string) => `Request failed: ${message}`,
    manifest: {
      notObject: 'Manifest must be a JSON object.',
      invalidJson: 'Manifest is not valid JSON.',
    },
  },
  create: {
    title: 'Create agent',
    fields: {
      agentId: 'Agent ID',
      code: 'Code',
      displayName: 'Display name',
      description: 'Description',
      visibility: 'Visibility',
      implementation: 'Implementation',
      manifest: 'Manifest (JSON object)',
    },
    cancel: 'Cancel',
    submit: 'Create',
  },
  edit: {
    title: (name: string) => `Edit agent ${name}`,
    meta: (agentId: string, version: string) => `${agentId} · version ${version}`,
    fields: {
      displayName: 'Display name',
      description: 'Description',
      visibility: 'Visibility',
      category: 'Category',
      tags: 'Tags (comma separated)',
      manifest: 'Manifest (JSON object)',
    },
    categoryNone: 'Uncategorized',
    categoryOption: (name: string, code: string) => `${name} (${code})`,
    inactiveCategory: (code: string) => `${code} (inactive)`,
    categoryHint: 'Category taxonomy is curated in Agent categories.',
    cancel: 'Cancel',
    submit: 'Save',
  },
};

export type AgentAdminCopy = typeof en;

const zh: AgentAdminCopy = {
  title: 'Agent 管理',
  description: '通过后台管理接口维护的受管 Agent。',
  actions: {
    newAgent: '新建 Agent',
  },
  table: {
    agent: 'Agent',
    code: '编码',
    implementation: '实现方式',
    category: '分类',
    visibility: '可见范围',
    status: '状态',
    version: '版本',
    updated: '更新时间',
    actions: '操作',
    uncategorized: '未分类',
    edit: '编辑',
    loading: '正在加载 Agent…',
    empty: '还没有受管 Agent',
  },
  status: {
    draft: '草稿',
    active: '启用',
    disabled: '停用',
    archived: '归档',
    deleted: '已删除',
  },
  visibility: {
    private: '私有',
    organization: '组织',
    tenant: '租户',
    public: '公开',
  },
  transitions: {
    activate: '启用',
    archive: '归档',
    disable: '停用',
    restore: '恢复记录',
  },
  notices: {
    created: 'Agent 已创建。',
    updated: (name) => `Agent「${name}」已更新。`,
    restored: (name) => `Agent「${name}」已恢复。`,
    statusChanged: (name, status) => `Agent「${name}」已切换为「${status}」。`,
  },
  errors: {
    requestFailed: (message) => `请求失败：${message}`,
    manifest: {
      notObject: 'Manifest 必须是 JSON 对象。',
      invalidJson: 'Manifest 不是合法的 JSON。',
    },
  },
  create: {
    title: '创建 Agent',
    fields: {
      agentId: 'Agent ID',
      code: '编码',
      displayName: '显示名称',
      description: '描述',
      visibility: '可见范围',
      implementation: '实现方式',
      manifest: 'Manifest（JSON 对象）',
    },
    cancel: '取消',
    submit: '创建',
  },
  edit: {
    title: (name) => `编辑 Agent ${name}`,
    meta: (agentId, version) => `${agentId} · 版本 ${version}`,
    fields: {
      displayName: '显示名称',
      description: '描述',
      visibility: '可见范围',
      category: '分类',
      tags: '标签（逗号分隔）',
      manifest: 'Manifest（JSON 对象）',
    },
    categoryNone: '未分类',
    categoryOption: (name, code) => `${name} (${code})`,
    inactiveCategory: (code) => `${code}（已停用）`,
    categoryHint: '分类体系在「Agent 分类」页面维护。',
    cancel: '取消',
    submit: '保存',
  },
};

export const AGENT_ADMIN_COPY: Record<'en' | 'zh', AgentAdminCopy> = { en, zh };

function documentLanguage(): 'en' | 'zh' {
  if (typeof document === 'undefined') {
    return 'en';
  }
  return document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function useAgentAdminLocale(): 'en' | 'zh' {
  const [language, setLanguage] = useState(documentLanguage);
  useEffect(() => {
    const update = () => setLanguage(documentLanguage());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });
    return () => observer.disconnect();
  }, []);
  return language;
}

export function useAgentAdminCopy(): AgentAdminCopy {
  const language = useAgentAdminLocale();
  return AGENT_ADMIN_COPY[language];
}
