/**
 * Professional agent taxonomy used by the agent creation and management
 * surfaces.
 *
 * Authority: the seeded `ai_agent_category` catalog generated from
 * `sdkwork-agents/scripts/agent-catalog/catalog.mjs`. A host that loads live
 * categories (the admin console reads the backend category API) passes them as
 * `AgentCategoryNode[]` to the creation flow; this constant is the documented
 * standalone default, mirroring the seeded two-level taxonomy so a client that
 * cannot reach the admin API still classifies agents professionally.
 *
 * Keep the codes in sync with the catalog seed: parent codes carry no agents,
 * leaves are the only assignable values.
 */

export interface AgentCategoryNode {
  code: string;
  label: string;
  description: string;
  iconRef: string;
  children: AgentCategoryNode[];
}

export interface AgentCategoryLeaf {
  code: string;
  label: string;
  description: string;
  iconRef: string;
  parentCode: string;
  parentLabel: string;
}

export const AGENT_CATEGORY_TAXONOMY: readonly AgentCategoryNode[] = [
  {
    code: 'technology',
    label: '技术与工程',
    description: '软件研发、数据智能、产品设计与本地运行时工程。',
    iconRef: 'Cpu',
    children: [
      { code: 'engineering', label: '工程技术', description: '代码、基础设施与工程交付。', iconRef: 'Code2', children: [] },
      { code: 'data-ai', label: '数据与人工智能', description: '数据分析、建模与机器学习工作。', iconRef: 'ChartNoAxesCombined', children: [] },
      { code: 'product', label: '产品与设计', description: '产品发现、用户体验与交互设计。', iconRef: 'PenTool', children: [] },
      { code: 'local-execution', label: '本地执行智能体', description: '以安装包分发到本地、由 Harness 运行时驱动的智能体。', iconRef: 'Package', children: [] },
    ],
  },
  {
    code: 'business',
    label: '商业与增长',
    description: '市场营销、销售、运营与电商交易。',
    iconRef: 'Briefcase',
    children: [
      { code: 'marketing', label: '市场营销', description: '营销活动、内容营销与品牌工作。', iconRef: 'Megaphone', children: [] },
      { code: 'sales', label: '销售与客户', description: '销售漏斗、客户成功与客户服务。', iconRef: 'Handshake', children: [] },
      { code: 'operations', label: '运营管理', description: '业务运营、流程与服务交付。', iconRef: 'Workflow', children: [] },
      { code: 'ecommerce', label: '电商零售', description: '商品、流量、转化与售后。', iconRef: 'ShoppingCart', children: [] },
    ],
  },
  {
    code: 'corporate',
    label: '企业职能',
    description: '财务、法务、人力资源与企业服务。',
    iconRef: 'Building2',
    children: [
      { code: 'finance', label: '财务与会计', description: '会计、税务、预算与投资分析。', iconRef: 'Calculator', children: [] },
      { code: 'legal', label: '法律法务', description: '法律、合同、合规与诉讼支持。', iconRef: 'Scale', children: [] },
      { code: 'hr', label: '人力资源', description: '招聘、绩效与组织发展。', iconRef: 'Users', children: [] },
      { code: 'enterprise', label: '企业服务', description: '注册、税务、资质与 B2B 咨询。', iconRef: 'Building', children: [] },
    ],
  },
  {
    code: 'education',
    label: '教育培训',
    description: 'K12、高等教育与职业培训。',
    iconRef: 'GraduationCap',
    children: [
      { code: 'education-k12', label: 'K12 教育', description: 'K12 课程、教学与辅导。', iconRef: 'BookOpen', children: [] },
      { code: 'education-higher', label: '高等教育', description: '高校教学、科研与学术写作。', iconRef: 'University', children: [] },
      { code: 'education-training', label: '职业培训', description: '职业学习、认证与技能训练。', iconRef: 'Presentation', children: [] },
    ],
  },
  {
    code: 'health',
    label: '健康与福祉',
    description: '临床证据、照护与健康指导。',
    iconRef: 'HeartPulse',
    children: [
      { code: 'healthcare', label: '医疗健康', description: '临床指南、药品参考与医学证据。', iconRef: 'Stethoscope', children: [] },
    ],
  },
  {
    code: 'public-service',
    label: '公共服务',
    description: '政务政策、行政流程与公共服务。',
    iconRef: 'Landmark',
    children: [
      { code: 'government', label: '政务公共服务', description: '官方政策、服务指南与行政流程。', iconRef: 'Landmark', children: [] },
    ],
  },
  {
    code: 'lifestyle',
    label: '生活服务',
    description: '旅游、住宿、餐饮与房产。',
    iconRef: 'Compass',
    children: [
      { code: 'travel', label: '旅游出行', description: '航班、酒店、景点与交通。', iconRef: 'Plane', children: [] },
      { code: 'hospitality', label: '酒店住宿', description: '房态、价格、OTA 渠道与宾客体验。', iconRef: 'BedDouble', children: [] },
      { code: 'restaurant', label: '餐饮食品', description: '菜单成本、POS、供应商与食品安全。', iconRef: 'UtensilsCrossed', children: [] },
      { code: 'realestate', label: '房产家居', description: '房源、成交可比、小区数据与政策。', iconRef: 'House', children: [] },
    ],
  },
  {
    code: 'content',
    label: '内容与媒体',
    description: '写作出版与媒体制作。',
    iconRef: 'Clapperboard',
    children: [
      { code: 'writing', label: '写作出版', description: '编辑规范、来源核验与出版。', iconRef: 'PenLine', children: [] },
      { code: 'media', label: '媒体制作', description: '音视频与多渠道内容制作。', iconRef: 'Video', children: [] },
    ],
  },
  {
    code: 'industrial',
    label: '制造与供应链',
    description: '生产、质量、采购与物流。',
    iconRef: 'Factory',
    children: [
      { code: 'manufacturing', label: '生产制造', description: '生产计划、质量与精益改善。', iconRef: 'Factory', children: [] },
      { code: 'supply-chain', label: '供应链物流', description: '采购、库存、仓储与物流。', iconRef: 'Truck', children: [] },
    ],
  },
];

/** Flattens the two-level taxonomy into assignable leaf options. */
export function listAgentCategoryLeaves(
  taxonomy: readonly AgentCategoryNode[] = AGENT_CATEGORY_TAXONOMY,
): AgentCategoryLeaf[] {
  const leaves: AgentCategoryLeaf[] = [];
  for (const parent of taxonomy) {
    for (const child of parent.children) {
      leaves.push({
        code: child.code,
        label: child.label,
        description: child.description,
        iconRef: child.iconRef,
        parentCode: parent.code,
        parentLabel: parent.label,
      });
    }
  }
  return leaves;
}

/** Human-readable label for a category code, falling back to the raw code. */
export function agentCategoryLabel(code: string | undefined): string | undefined {
  if (!code) {
    return undefined;
  }
  return listAgentCategoryLeaves().find((leaf) => leaf.code === code)?.label ?? code;
}

/** True when the code is an assignable leaf of the professional taxonomy. */
export function isAgentCategoryCode(code: string | undefined): boolean {
  return Boolean(code && listAgentCategoryLeaves().some((leaf) => leaf.code === code));
}
