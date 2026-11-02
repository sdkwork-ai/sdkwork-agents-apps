/// Creative studio copy for the Agents Flutter mobile root.
///
/// Code-level defaults in the same shape as the existing capability packages;
/// every key is present in `zh-CN` and `en-US`.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

const Map<String, Map<String, String>> agentsCreativeMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.creative.title': 'Create',
    'agents.creative.prompt.label': 'Describe what you want to create',
    'agents.creative.prompt.hint':
        'A poster with warm sunset light, minimal layout...',
    'agents.creative.modality.label': 'Modality',
    'agents.creative.modality.image': 'Image',
    'agents.creative.modality.video': 'Video',
    'agents.creative.modality.music': 'Music',
    'agents.creative.modality.voice': 'Voice',
    'agents.creative.modality.sfx': 'Sound effect',
    'agents.creative.aspect.label': 'Aspect ratio',
    'agents.creative.aspect.square': 'Square',
    'agents.creative.aspect.portrait': 'Portrait',
    'agents.creative.aspect.landscape': 'Landscape',
    'agents.creative.submit': 'Generate',
    'agents.creative.submitting': 'Submitting',
    'agents.creative.sessions.title': 'Sessions',
    'agents.creative.sessions.empty': 'No creative sessions yet',
    'agents.creative.sessions.loadFailed': 'Failed to load creative sessions',
    'agents.creative.results.title': 'Results',
    'agents.creative.results.empty': 'This session has no results yet',
    'agents.creative.unavailable.title': 'Creative studio is not available yet',
    'agents.creative.unavailable.hint':
        'This client has no generation service transport. '
            'Retry once the service is connected.',
    'agents.creative.retry': 'Retry',
    'agents.creative.submitFailed':
        'Generation submission failed. Please retry.',
    'agents.creative.sessionLoadFailed': 'Failed to load this session',
    'agents.creative.resultImageFailed': 'Preview unavailable',
    'agents.creative.resultVideo': 'Video',
    'agents.creative.resultAudio': 'Audio',
  },
  'zh-CN': <String, String>{
    'agents.creative.title': '生成',
    'agents.creative.prompt.label': '描述你想生成的内容',
    'agents.creative.prompt.hint': '一张日落暖光的海报，极简排版……',
    'agents.creative.modality.label': '类型',
    'agents.creative.modality.image': '图片',
    'agents.creative.modality.video': '视频',
    'agents.creative.modality.music': '音乐',
    'agents.creative.modality.voice': '配音',
    'agents.creative.modality.sfx': '音效',
    'agents.creative.aspect.label': '画面比例',
    'agents.creative.aspect.square': '方形',
    'agents.creative.aspect.portrait': '竖版',
    'agents.creative.aspect.landscape': '横版',
    'agents.creative.submit': '开始生成',
    'agents.creative.submitting': '提交中',
    'agents.creative.sessions.title': '创作会话',
    'agents.creative.sessions.empty': '还没有创作会话',
    'agents.creative.sessions.loadFailed': '创作会话加载失败',
    'agents.creative.results.title': '生成结果',
    'agents.creative.results.empty': '本次会话还没有生成结果',
    'agents.creative.unavailable.title': '生成服务暂未接入',
    'agents.creative.unavailable.hint': '当前客户端还没有生成服务通道，接入后即可重试。',
    'agents.creative.retry': '重试',
    'agents.creative.submitFailed': '提交生成失败，请重试',
    'agents.creative.sessionLoadFailed': '该会话加载失败',
    'agents.creative.resultImageFailed': '预览暂不可用',
    'agents.creative.resultVideo': '视频',
    'agents.creative.resultAudio': '音频',
  },
};

String translateAgentsCreativeMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages = agentsCreativeMessages[tag] ??
      agentsCreativeMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

String Function(String) createAgentsCreativeTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsCreativeMessage(tag, key);
}
