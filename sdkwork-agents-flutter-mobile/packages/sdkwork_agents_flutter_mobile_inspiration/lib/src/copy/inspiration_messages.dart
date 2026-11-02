/// Inspiration copy for the Agents Flutter mobile root.
///
/// These `const` maps are code-level defaults in the same shape as the existing
/// capability packages. The authored fragment projection (`lib/src/i18n/...`)
/// is tracked separately; every key below is present in both `zh-CN` and
/// `en-US`.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

const Map<String, Map<String, String>> agentsInspirationMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.inspiration.title': 'Inspiration',
    'agents.inspiration.channel.discover': 'Discover',
    'agents.inspiration.channel.featured': 'Featured',
    'agents.inspiration.loading': 'Loading inspiration',
    'agents.inspiration.empty': 'No inspiration yet',
    'agents.inspiration.loadFailed':
        'Failed to load inspiration. Please retry.',
    'agents.inspiration.unavailable.title': 'Inspiration is not available yet',
    'agents.inspiration.unavailable.hint':
        'This client has no inspiration service transport. '
            'Retry once the service is connected.',
    'agents.inspiration.retry': 'Retry',
    'agents.inspiration.likes': 'likes',
    'agents.inspiration.coverUnavailable': 'Cover unavailable',
  },
  'zh-CN': <String, String>{
    'agents.inspiration.title': '灵感',
    'agents.inspiration.channel.discover': '发现',
    'agents.inspiration.channel.featured': '精选',
    'agents.inspiration.loading': '灵感加载中',
    'agents.inspiration.empty': '还没有灵感内容',
    'agents.inspiration.loadFailed': '灵感加载失败，请稍后重试',
    'agents.inspiration.unavailable.title': '灵感服务暂未接入',
    'agents.inspiration.unavailable.hint': '当前客户端还没有灵感服务通道，接入后即可重试。',
    'agents.inspiration.retry': '重试',
    'agents.inspiration.likes': '赞',
    'agents.inspiration.coverUnavailable': '封面暂不可用',
  },
};

String translateAgentsInspirationMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages = agentsInspirationMessages[tag] ??
      agentsInspirationMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

String Function(String) createAgentsInspirationTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsInspirationMessage(tag, key);
}
