/// Canvas copy for the Agents Flutter mobile root.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

const Map<String, Map<String, String>> agentsCanvasMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.canvas.title': 'Canvas',
    'agents.canvas.loading': 'Loading the canvas',
    'agents.canvas.empty':
        'The canvas is empty. Create your first workflow on desktop.',
    'agents.canvas.unavailable.title': 'Canvas is not available yet',
    'agents.canvas.unavailable.hint':
        'This client has no canvas store composed. Retry once the workflow is synced.',
    'agents.canvas.loadFailed': 'Failed to load the canvas. Please retry.',
    'agents.canvas.retry': 'Retry',
    'agents.canvas.readOnly': 'Read-only preview on mobile. Edit on desktop.',
    'agents.canvas.node.text': 'Text',
    'agents.canvas.node.imageGen': 'Image',
    'agents.canvas.node.videoGen': 'Video',
    'agents.canvas.node.flowStep': 'Flow',
    'agents.canvas.node.sticky': 'Sticky',
    'agents.canvas.status.idle': 'Idle',
    'agents.canvas.status.generating': 'Generating',
    'agents.canvas.status.completed': 'Completed',
    'agents.canvas.status.failed': 'Failed',
    'agents.canvas.connections': '{{count}} connections',
  },
  'zh-CN': <String, String>{
    'agents.canvas.title': '画布',
    'agents.canvas.loading': '正在加载画布',
    'agents.canvas.empty': '画布还没有内容，去 PC 端创建第一个工作流。',
    'agents.canvas.unavailable.title': '画布暂未接入',
    'agents.canvas.unavailable.hint': '当前客户端还没有画布存储通道，同步后即可重试。',
    'agents.canvas.loadFailed': '画布加载失败，请稍后重试',
    'agents.canvas.retry': '重试',
    'agents.canvas.readOnly': '移动端只读预览，编辑请在 PC 端进行。',
    'agents.canvas.node.text': '文本',
    'agents.canvas.node.imageGen': '图片',
    'agents.canvas.node.videoGen': '视频',
    'agents.canvas.node.flowStep': '流程',
    'agents.canvas.node.sticky': '便签',
    'agents.canvas.status.idle': '待生成',
    'agents.canvas.status.generating': '生成中',
    'agents.canvas.status.completed': '已完成',
    'agents.canvas.status.failed': '失败',
    'agents.canvas.connections': '{{count}} 条连线',
  },
};

String translateAgentsCanvasMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages = agentsCanvasMessages[tag] ??
      agentsCanvasMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

String Function(String) createAgentsCanvasTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsCanvasMessage(tag, key);
}
