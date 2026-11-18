import { useEffect, useState } from 'react';

/**
 * Local copy bundle for the Agent category administration block.
 *
 * The block is mounted by several hosts, so it carries its own English and
 * Chinese copy instead of depending on host-specific translation keys. The
 * language is read from the host document language (`<html lang>`), which both
 * the Cloud Router admin shell and the Agents shell keep in sync with their
 * i18n instance.
 */
const en = {
  eyebrow: 'AI Foundation · Agent',
  title: 'Agent categories',
  description:
    'Curate the taxonomy that classifies managed agents in the catalog and admin pickers. Categories are retired with a lifecycle status instead of being hard-deleted, so existing agent references remain valid.',
  actions: {
    export: 'Export',
    exportTitle: 'Export the current view as CSV',
    newCategory: 'New category',
    dismissNotification: 'Dismiss notification',
  },
  tabs: {
    all: 'All',
    active: 'Active',
    draft: 'Draft',
    disabled: 'Disabled',
    archived: 'Archived',
  },
  search: {
    label: 'Search categories',
    placeholder: 'Search name, code, description or parent',
  },
  summary: {
    ofTotal: (visible: number, total: number) => `${visible} of ${total} categories`,
    total: (total: number) => `${total} categories`,
    active: (active: number) => `${active} active`,
    clearFilters: 'Clear filters',
  },
  table: {
    caption: 'Managed agent category taxonomy, ordered by placement and sort order',
    category: 'Category',
    code: 'Code',
    placement: 'Placement',
    order: 'Order',
    status: 'Status',
    updated: 'Updated',
    actions: 'Actions',
    child: 'Child',
    noDescription: 'No description',
    topLevel: 'Top level',
    copyTitle: 'Copy code',
    copyCode: (code: string) => `Copy code ${code}`,
    copied: 'Copied',
    copiedCode: (code: string) => `Copied ${code}`,
    edit: 'Edit',
    disable: 'Disable',
    activate: 'Activate',
    disableTitle:
      'Retire this category for new classification. Existing agent references remain valid.',
    activateTitle: 'Make this category selectable for new agent classification again.',
    loadingLabel: 'Loading agent categories',
  },
  empty: {
    title: 'No agent categories yet',
    description:
      'Create the first category to start classifying managed agents. Categories can be top-level or one level deep.',
    create: 'Create category',
  },
  noResults: {
    title: 'No matching categories',
    description: 'No category matches the current search and status filters.',
    clear: 'Clear filters',
  },
  errors: {
    title: 'Categories could not be loaded',
    description: 'Check the network or permissions, then retry from the banner above.',
    retry: 'Retry',
    conflict:
      'This category changed since the list was loaded. The latest catalog has been reloaded; try again.',
    retryHint: 'Use Retry above.',
  },
  footer: {
    showing: (visible: number, total: number, loaded: number) =>
      `Showing ${visible} of ${total} categories${
        loaded < total ? ` (first ${loaded} loaded)` : ''
      }`,
    sorted: 'Sorted by order, then name',
  },
  notices: {
    saved: (name: string) => `Category “${name}” saved.`,
    activated: (name: string) => `Category “${name}” is active again.`,
    disabled: (name: string) => `Category “${name}” is disabled for new classification.`,
  },
  status: {
    active: 'Active',
    draft: 'Draft',
    disabled: 'Disabled',
    archived: 'Archived',
    deleted: 'Deleted',
  },
  drawer: {
    createEyebrow: 'New category',
    editEyebrow: 'Edit category',
    createTitle: 'Create an agent category',
    editTitle: (name: string) => `Edit category ${name}`,
    createSubtitle:
      'Categories group managed agents in the catalog, console filters, and admin pickers.',
    editSubtitle: (code: string) =>
      `Code ${code} is the category identity and cannot be changed.`,
    closeLabel: 'Close category editor',
    sections: {
      identityTitle: 'Identity',
      identityDescription:
        'The code is stable identity used by agent records; the display name is shown to operators.',
      placementTitle: 'Placement',
      placementDescription:
        'Placement controls where the category appears in the catalog tree.',
      presentationTitle: 'Presentation',
      presentationDescription:
        'Presentation metadata helps operators scan the taxonomy; it is not used for classification.',
      lifecycleTitle: 'Lifecycle',
      lifecycleDescription:
        'Only active categories can classify new agents or accept children.',
    },
    fields: {
      code: 'Category code',
      name: 'Display name',
      parent: 'Parent category',
      sortOrder: 'Sort order',
      description: 'Description',
      iconRef: 'Icon reference',
      status: 'Status',
    },
    hints: {
      codeImmutable: 'Category codes are immutable after creation.',
      codePattern:
        'Lowercase letters, digits, underscores and hyphens; 2–128 characters.',
      codeExists: (code: string) =>
        `Code “${code}” already exists — saving updates that category.`,
      name: 'Shown in the agent catalog, filters and admin tables.',
      parent: 'Leave empty for a top-level category. Categories support two levels.',
      parentHasChildren: 'This category has children and must stay top-level.',
      sortOrder: 'Lower values appear first; 0–9999.',
      description: 'Optional context for operators and internal documentation.',
      iconRef:
        'Optional image or drive reference. http(s): and root-relative URLs render inline; other references are kept as metadata.',
    },
    parentNone: 'None — top level',
    parentInactive: (name: string) => `${name} (inactive)`,
    placeholders: {
      code: 'education',
      name: 'Education',
      description: 'Who this category is for and what it covers.',
      icon: 'drive://icons/education',
    },
    statusOptions: {
      active: {
        label: 'Active',
        hint: 'Selectable in agent categorization and available as a parent.',
      },
      draft: {
        label: 'Draft',
        hint: 'Hidden from agent categorization until activated.',
      },
      disabled: {
        label: 'Disabled',
        hint: 'Retired for new classification; existing references stay valid.',
      },
      archived: {
        label: 'Archived',
        hint: 'Kept for historical reporting only.',
      },
    },
    versionNote: (version: string) =>
      `Editing version ${version}. Saving with a stale version returns a conflict and reloads the latest catalog.`,
    cancel: 'Cancel',
    save: 'Save changes',
    create: 'Create category',
    saving: 'Saving…',
    required: 'Required',
    discardTitle: 'Discard unsaved changes?',
    discardBody: 'Your category edits have not been saved.',
    discardConfirm: 'Discard changes',
    discardCancel: 'Keep editing',
    errors: {
      codeRequired: 'Category code is required.',
      codeInvalid:
        'Use 2–128 lowercase letters, digits, underscores or hyphens, starting with a letter or digit.',
      nameRequired: 'Display name is required.',
      nameTooLong: 'Display name must be at most 255 characters.',
      descriptionTooLong: 'Description must be at most 2000 characters.',
      iconTooLong: 'Icon reference must be at most 512 characters.',
      sortInvalid: 'Sort order must be an integer between 0 and 9999.',
      parentMissing: 'The selected parent category no longer exists.',
      parentInactive: 'Only active categories can be used as a parent.',
      parentNested: 'Categories support at most two levels.',
      parentSelf: 'A category cannot be its own parent.',
      conflict:
        'This category changed since it was loaded. Close the drawer and reopen it to edit the latest version.',
    },
  },
};

export type AgentCategoryCopy = typeof en;

const zh: AgentCategoryCopy = {
  eyebrow: '人工智能基础管理 · Agent',
  title: 'Agent 分类',
  description:
    '维护用于 Agent 归类、目录筛选和后台选择器的分类体系。分类通过生命周期状态退役，而不是硬删除，因此已有 Agent 引用始终有效。',
  actions: {
    export: '导出',
    exportTitle: '将当前视图导出为 CSV',
    newCategory: '新建分类',
    dismissNotification: '关闭提示',
  },
  tabs: {
    all: '全部',
    active: '启用',
    draft: '草稿',
    disabled: '停用',
    archived: '归档',
  },
  search: {
    label: '搜索分类',
    placeholder: '搜索名称、编码、描述或父分类',
  },
  summary: {
    ofTotal: (visible, total) => `${visible} / ${total} 个分类`,
    total: (total) => `${total} 个分类`,
    active: (active) => `${active} 个启用`,
    clearFilters: '清除筛选',
  },
  table: {
    caption: 'Agent 分类体系，按层级和排序值排列',
    category: '分类',
    code: '编码',
    placement: '层级',
    order: '排序',
    status: '状态',
    updated: '更新时间',
    actions: '操作',
    child: '子分类',
    noDescription: '暂无描述',
    topLevel: '顶级分类',
    copyTitle: '复制编码',
    copyCode: (code) => `复制编码 ${code}`,
    copied: '已复制',
    copiedCode: (code) => `已复制 ${code}`,
    edit: '编辑',
    disable: '停用',
    activate: '启用',
    disableTitle: '对新归类停用该分类，已有 Agent 引用仍然有效。',
    activateTitle: '重新允许该分类用于新的 Agent 归类。',
    loadingLabel: '正在加载 Agent 分类',
  },
  empty: {
    title: '还没有 Agent 分类',
    description:
      '创建第一个分类来开始归类 Agent。分类可以是顶级分类，也可以有一级子分类。',
    create: '创建分类',
  },
  noResults: {
    title: '没有匹配的分类',
    description: '当前搜索和状态筛选下没有匹配的分类。',
    clear: '清除筛选',
  },
  errors: {
    title: '分类加载失败',
    description: '请检查网络或权限，然后使用上方提示中的重试操作。',
    retry: '重试',
    conflict: '该分类在列表加载后已被修改，已重新加载最新分类，请重试。',
    retryHint: '请使用上方的“重试”。',
  },
  footer: {
    showing: (visible, total, loaded) =>
      `显示 ${total} 个分类中的 ${visible} 个${
        loaded < total ? `（已加载前 ${loaded} 个）` : ''
      }`,
    sorted: '按排序值、名称排序',
  },
  notices: {
    saved: (name) => `分类「${name}」已保存。`,
    activated: (name) => `分类「${name}」已重新启用。`,
    disabled: (name) => `分类「${name}」已停用，不再用于新的归类。`,
  },
  status: {
    active: '启用',
    draft: '草稿',
    disabled: '停用',
    archived: '归档',
    deleted: '已删除',
  },
  drawer: {
    createEyebrow: '新建分类',
    editEyebrow: '编辑分类',
    createTitle: '创建 Agent 分类',
    editTitle: (name) => `编辑分类 ${name}`,
    createSubtitle: '分类用于在目录、控制台筛选和后台选择器中组织 Agent。',
    editSubtitle: (code) => `编码 ${code} 是分类的唯一标识，创建后不可修改。`,
    closeLabel: '关闭分类编辑器',
    sections: {
      identityTitle: '基础信息',
      identityDescription: '编码是 Agent 记录引用的稳定标识，显示名称用于运营人员识别。',
      placementTitle: '层级归属',
      placementDescription: '层级决定分类在目录树中的位置。',
      presentationTitle: '展示信息',
      presentationDescription: '展示信息帮助运营人员浏览分类，不参与归类逻辑。',
      lifecycleTitle: '生命周期',
      lifecycleDescription: '只有启用状态的分类才能用于新的 Agent 归类或作为父分类。',
    },
    fields: {
      code: '分类编码',
      name: '显示名称',
      parent: '父分类',
      sortOrder: '排序值',
      description: '描述',
      iconRef: '图标引用',
      status: '状态',
    },
    hints: {
      codeImmutable: '分类编码创建后不可修改。',
      codePattern: '支持小写字母、数字、下划线和连字符，长度 2–128 个字符。',
      codeExists: (code) => `编码「${code}」已存在，保存将更新该分类。`,
      name: '显示在 Agent 目录、筛选项和后台表格中。',
      parent: '留空表示顶级分类。分类体系最多支持两级。',
      parentHasChildren: '该分类已有子分类，必须保持为顶级分类。',
      sortOrder: '数值越小越靠前，范围 0–9999。',
      description: '可选的运营说明或内部文档。',
      iconRef:
        '可选的图片或 Drive 引用。http(s): 和根相对地址会内联展示，其他引用作为元数据保存。',
    },
    parentNone: '无 — 顶级分类',
    parentInactive: (name) => `${name}（已停用）`,
    placeholders: {
      code: 'education',
      name: '教育',
      description: '说明该分类面向谁、覆盖什么内容。',
      icon: 'drive://icons/education',
    },
    statusOptions: {
      active: {
        label: '启用',
        hint: '可用于 Agent 归类，也可以作为父分类。',
      },
      draft: {
        label: '草稿',
        hint: '在启用前不会出现在 Agent 归类页。',
      },
      disabled: {
        label: '停用',
        hint: '不再用于新的归类，已有引用保持有效。',
      },
      archived: {
        label: '归档',
        hint: '仅用于历史报表保留。',
      },
    },
    versionNote: (version) =>
      `正在编辑版本 ${version}。如果版本已过期，保存会返回冲突并重新加载最新分类。`,
    cancel: '取消',
    save: '保存修改',
    create: '创建分类',
    saving: '保存中…',
    required: '必填',
    discardTitle: '放弃未保存的修改？',
    discardBody: '当前的分类修改尚未保存。',
    discardConfirm: '放弃修改',
    discardCancel: '继续编辑',
    errors: {
      codeRequired: '分类编码不能为空。',
      codeInvalid: '请使用 2–128 个小写字母、数字、下划线或连字符，并以字母或数字开头。',
      nameRequired: '显示名称不能为空。',
      nameTooLong: '显示名称最多 255 个字符。',
      descriptionTooLong: '描述最多 2000 个字符。',
      iconTooLong: '图标引用最多 512 个字符。',
      sortInvalid: '排序值必须是 0–9999 之间的整数。',
      parentMissing: '所选父分类已不存在。',
      parentInactive: '只有启用状态的分类可以作为父分类。',
      parentNested: '分类体系最多支持两级。',
      parentSelf: '分类不能作为自己的父分类。',
      conflict: '该分类在加载后已被修改。请关闭抽屉并重新打开以编辑最新版本。',
    },
  },
};

export const AGENT_CATEGORY_COPY: Record<'en' | 'zh', AgentCategoryCopy> = { en, zh };

function documentLanguage(): 'en' | 'zh' {
  if (typeof document === 'undefined') {
    return 'en';
  }
  return document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function useAgentCategoryLocale(): 'en' | 'zh' {
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

export function useAgentCategoryCopy(): AgentCategoryCopy {
  const language = useAgentCategoryLocale();
  return AGENT_CATEGORY_COPY[language];
}
