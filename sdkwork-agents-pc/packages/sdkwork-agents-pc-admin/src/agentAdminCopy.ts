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
  overlay: {
    close: 'Close',
  },
  selection: {
    searchPlaceholder: 'Search…',
    noMatch: 'No matching options.',
    selectedCount: (count: number) => `${count} selected`,
    clear: 'Clear selection',
    cancel: 'Cancel',
    confirm: 'Apply',
  },
  roles: {
    legend: 'Visible to roles',
    allRoles: 'All roles (default)',
    customRole: 'Custom role',
    modalTitle: 'Select visible roles',
    modalDescription:
      'The agent is visible to every selected role. Leave the selection empty to keep it visible to all roles.',
    labels: {} as Record<string, string>,
  },
  package: {
    legend: 'Agent package',
    hint: 'Local-execution agents are distributed as a zip package. Uploading stores it in sdkwork-drive and records the SHA-256 checksum.',
    kind: 'Agent kind',
    kinds: {
      conversation: 'Conversation agent',
      localExecution: 'Local execution agent',
    },
    engine: 'Runtime engine',
    current: 'Current package',
    noPackage: 'No package uploaded yet',
    notUploaded: 'Catalog reference only (not uploaded)',
    uploaded: (name: string) => `Uploaded: ${name}`,
    uploadedBadge: 'Uploaded',
    choose: 'Select zip package',
    upload: 'Upload package',
    uploading: 'Uploading…',
    missing: 'Select a .zip agent package first.',
    checksum: (value: string) => `sha256:${value}`,
    driveRef: 'Drive package',
    engineChanged:
      'The runtime engine changed. Upload a package that matches the new engine.',
  },
  actions: {
    newAgent: 'New agent',
  },
  filters: {
    keywordLabel: 'Search agents',
    keywordPlaceholder: 'name, code, category',
    categoryLabel: 'Category',
    allCategories: 'All categories',
    roleScopeLabel: 'Data scope',
    roleScopeAll: 'All data',
    roleScopeMine: 'My roles',
    roleScopeUnavailable: 'The host did not supply the operator role codes.',
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
  pagination: {
    previous: 'Previous page',
    next: 'Next page',
    pageSize: 'Rows per page',
    page: (page: number, totalPages: number) => `Page ${page} / ${totalPages}`,
    showing: (start: number, end: number, total: number) =>
      `Showing ${start} - ${end} of ${total}`,
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
    categoryPickerTitle: 'Select agent category',
    categoryPickerDescription:
      'Only leaf specialties are assignable. Domain rows are grouping labels.',
    categoryLeafHint: 'Domains are grouping labels; assign a specialty.',
    cancel: 'Cancel',
    submit: 'Save',
  },
};

export type AgentAdminCopy = typeof en;

const zh: AgentAdminCopy = {
  title: 'Agent 管理',
  description: '通过后台管理接口维护的受管 Agent。',
  overlay: {
    close: '关闭',
  },
  selection: {
    searchPlaceholder: '搜索…',
    noMatch: '无匹配项',
    selectedCount: (count) => `已选 ${count} 项`,
    clear: '清空选择',
    cancel: '取消',
    confirm: '确定',
  },
  roles: {
    legend: '可见角色',
    allRoles: '全部角色（默认）',
    customRole: '自定义角色',
    modalTitle: '选择可见角色',
    modalDescription: 'Agent 对所选角色可见；不选择任何角色时，默认对全部角色可见。',
    labels: {
      app_user: '应用用户',
      org_admin: '组织管理员',
      org_assistant: '组织助理',
      org_auditor: '组织审计员',
      org_finance: '组织财务',
      org_operations: '组织运营',
      platform_system_admin: '平台系统管理员',
      platform_super_admin: '平台超级管理员',
      skills_admin_operator: '技能运营管理员',
      skills_marketplace_user: '技能市场用户',
    },
  },
  package: {
    legend: 'Agent 安装包',
    hint: '本地执行 Agent 以 zip 安装包分发。上传后会保存到 sdkwork-drive，并记录 SHA-256 校验和。',
    kind: 'Agent 类型',
    kinds: {
      conversation: '对话 Agent',
      localExecution: '本地执行 Agent',
    },
    engine: '运行时引擎',
    current: '当前安装包',
    noPackage: '尚未上传安装包',
    notUploaded: '仅目录引用（未上传）',
    uploaded: (name) => `已上传：${name}`,
    uploadedBadge: '已上传',
    choose: '选择 zip 安装包',
    upload: '上传安装包',
    uploading: '上传中…',
    missing: '请先选择 .zip 安装包。',
    checksum: (value) => `sha256:${value}`,
    driveRef: 'Drive 安装包',
    engineChanged: '运行时引擎已变更，请上传与新引擎匹配的安装包。',
  },
  actions: {
    newAgent: '新建 Agent',
  },
  filters: {
    keywordLabel: '搜索 Agent',
    keywordPlaceholder: '名称、编码、分类',
    categoryLabel: '分类',
    allCategories: '全部分类',
    roleScopeLabel: '数据范围',
    roleScopeAll: '全部数据',
    roleScopeMine: '我的角色',
    roleScopeUnavailable: '宿主未提供当前操作者的角色编码。',
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
  pagination: {
    previous: '上一页',
    next: '下一页',
    pageSize: '每页行数',
    page: (page, totalPages) => `第 ${page} / ${totalPages} 页`,
    showing: (start, end, total) => `显示第 ${start} - ${end} 条，共 ${total} 条`,
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
    categoryPickerTitle: '选择 Agent 分类',
    categoryPickerDescription: '只能选择末级专业分类；领域行仅用于分组展示。',
    categoryLeafHint: '领域仅用于分组，请选择具体专业分类。',
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
