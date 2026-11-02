/**
 * Asset library surface copy (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMpAssetsZhCn = {
  "agents.assets.title": "资产",
  "agents.assets.filter.all": "全部",
  "agents.assets.filter.image": "图片",
  "agents.assets.filter.video": "视频",
  "agents.assets.filter.audio": "音频",
  "agents.assets.filter.other": "其他",
  "agents.assets.loading": "正在加载资产",
  "agents.assets.empty": "还没有生成资产",
  "agents.assets.emptyFiltered": "没有符合筛选条件的资产",
  "agents.assets.loadFailed": "资产加载失败，请重试",
  "agents.assets.count": "共 {{count}} 项",
  "agents.assets.detail.title": "资产详情",
  "agents.assets.detail.kind": "类型",
  "agents.assets.detail.createdAt": "生成时间",
  "agents.assets.detail.source": "来源工具",
  "agents.assets.detail.openFailed": "无法打开该资产",
  "agents.assets.detail.play": "播放",
  "agents.assets.detail.pause": "暂停",
  "agents.assets.detail.open": "打开文件",
  "agents.assets.detail.emptyPreview": "该资产没有可预览的地址",
  "agents.assets.kind.image": "图片",
  "agents.assets.kind.video": "视频",
  "agents.assets.kind.audio": "音频",
  "agents.assets.kind.other": "文件",
} as const;

export type AgentsMpAssetsMessageKey = keyof typeof agentsMpAssetsZhCn;
