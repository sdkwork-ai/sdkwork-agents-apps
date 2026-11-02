/// Asset library copy for the Agents Flutter mobile root.
///
/// Code-level defaults in the same shape as the existing capability packages;
/// every key is present in `zh-CN` and `en-US`.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

const Map<String, Map<String, String>> agentsAssetsMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.assets.title': 'Assets',
    'agents.assets.filter.all': 'All',
    'agents.assets.kind.image': 'Image',
    'agents.assets.kind.video': 'Video',
    'agents.assets.kind.audio': 'Audio',
    'agents.assets.kind.document': 'Document',
    'agents.assets.kind.other': 'Other',
    'agents.assets.loading': 'Loading assets',
    'agents.assets.empty': 'No assets yet',
    'agents.assets.emptyFiltered': 'No assets of this kind',
    'agents.assets.loadFailed': 'Failed to load assets. Please retry.',
    'agents.assets.unavailable.title': 'Assets are not available yet',
    'agents.assets.unavailable.hint':
        'This client has no asset service transport. Retry once the service is connected.',
    'agents.assets.retry': 'Retry',
    'agents.assets.date.today': 'Today',
    'agents.assets.date.yesterday': 'Yesterday',
    'agents.assets.date.unknown': 'Undated',
    'agents.assets.detail.title': 'Asset details',
    'agents.assets.detail.kind': 'Kind',
    'agents.assets.detail.createdAt': 'Created',
    'agents.assets.detail.tool': 'Tool',
    'agents.assets.detail.driveUri': 'Drive URI',
    'agents.assets.detail.close': 'Close',
    'agents.assets.detail.missing': 'This asset is no longer available.',
    'agents.assets.previewUnavailable': 'Preview unavailable',
    'agents.assets.itemCount': 'items',
  },
  'zh-CN': <String, String>{
    'agents.assets.title': '资产',
    'agents.assets.filter.all': '全部',
    'agents.assets.kind.image': '图片',
    'agents.assets.kind.video': '视频',
    'agents.assets.kind.audio': '音频',
    'agents.assets.kind.document': '文档',
    'agents.assets.kind.other': '其他',
    'agents.assets.loading': '资产加载中',
    'agents.assets.empty': '还没有资产',
    'agents.assets.emptyFiltered': '该类型下暂无资产',
    'agents.assets.loadFailed': '资产加载失败，请稍后重试',
    'agents.assets.unavailable.title': '资产服务暂未接入',
    'agents.assets.unavailable.hint': '当前客户端还没有资产服务通道，接入后即可重试。',
    'agents.assets.retry': '重试',
    'agents.assets.date.today': '今天',
    'agents.assets.date.yesterday': '昨天',
    'agents.assets.date.unknown': '日期未知',
    'agents.assets.detail.title': '资产详情',
    'agents.assets.detail.kind': '类型',
    'agents.assets.detail.createdAt': '创建时间',
    'agents.assets.detail.tool': '生成工具',
    'agents.assets.detail.driveUri': 'Drive 地址',
    'agents.assets.detail.close': '关闭',
    'agents.assets.detail.missing': '该资产已不可用。',
    'agents.assets.previewUnavailable': '预览暂不可用',
    'agents.assets.itemCount': '项',
  },
};

String translateAgentsAssetsMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages = agentsAssetsMessages[tag] ??
      agentsAssetsMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

String Function(String) createAgentsAssetsTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsAssetsMessage(tag, key);
}
