/**
 * Creative studio surface copy (zh-CN).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMpCreativeZhCn = {
  "agents.creative.title": "生成",
  "agents.creative.prompt.label": "提示词",
  "agents.creative.prompt.placeholder": "描述你想生成的内容",
  "agents.creative.modality.label": "生成类型",
  "agents.creative.modality.image": "图片",
  "agents.creative.modality.video": "视频",
  "agents.creative.modality.music": "音乐",
  "agents.creative.aspect.label": "画幅",
  "agents.creative.aspect.square": "1:1",
  "agents.creative.aspect.landscape": "3:2",
  "agents.creative.aspect.portrait": "2:3",
  "agents.creative.submit": "开始生成",
  "agents.creative.submitting": "生成中",
  "agents.creative.promptRequired": "请先填写提示词",
  "agents.creative.loading": "正在加载生成能力",
  "agents.creative.loadFailed": "生成能力加载失败，请重试",
  "agents.creative.unavailable": "生成服务在当前运行环境中不可用",
  "agents.creative.noTools": "当前没有可用的生成类型",
  "agents.creative.sessions.title": "本机创作记录",
  "agents.creative.sessions.empty": "还没有创作记录",
  "agents.creative.sessions.clear": "清空记录",
  "agents.creative.sessions.cleared": "创作记录已清空",
  "agents.creative.sessions.localNote": "创作记录仅保存在本机",
  "agents.creative.results.title": "生成结果",
  "agents.creative.results.empty": "本次生成没有返回可展示的结果",
  "agents.creative.submitFailed": "生成失败，请重试",
  "agents.creative.pending": "生成任务已提交，完成后可在资产中查看",
  "agents.creative.status.succeeded": "已完成",
  "agents.creative.status.failed": "失败",
  "agents.creative.status.pending": "处理中",
  "agents.creative.meta": "{{time}} · {{modality}}",
  "agents.creative.openFailed": "无法打开该生成结果",
  "agents.creative.play": "播放",
  "agents.creative.pause": "暂停",
  "agents.creative.open": "打开",
} as const;

export type AgentsMpCreativeMessageKey = keyof typeof agentsMpCreativeZhCn;
