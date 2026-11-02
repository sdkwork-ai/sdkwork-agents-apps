/// Membership copy for the Agents Flutter mobile root.
///
/// Code-level defaults in the same shape as the existing capability packages;
/// every key is present in `zh-CN` and `en-US`.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

const Map<String, Map<String, String>> agentsMembershipMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.membership.title': 'Membership',
    'agents.membership.loading': 'Loading membership plans',
    'agents.membership.loadFailed':
        'Failed to load membership plans. Please retry.',
    'agents.membership.unavailable.title': 'Membership is not available yet',
    'agents.membership.unavailable.hint':
        'This client has no membership service transport. '
            'Retry once the service is connected.',
    'agents.membership.retry': 'Retry',
    'agents.membership.summary.title': 'Current membership',
    'agents.membership.summary.member': 'Member',
    'agents.membership.summary.guest': 'Not a member',
    'agents.membership.summary.points': 'Points balance',
    'agents.membership.summary.expiresAt': 'Valid until',
    'agents.membership.plans.title': 'Plans',
    'agents.membership.plans.empty': 'No plans are published yet',
    'agents.membership.plans.current': 'Current plan',
    'agents.membership.plans.recommended': 'Recommended',
    'agents.membership.checkout': 'Subscribe',
    'agents.membership.checkoutUnavailable': 'Checkout is not available yet',
    'agents.membership.checkoutReady': 'Checkout link',
    'agents.membership.checkoutClose': 'Close',
  },
  'zh-CN': <String, String>{
    'agents.membership.title': '会员',
    'agents.membership.loading': '会员方案加载中',
    'agents.membership.loadFailed': '会员方案加载失败，请稍后重试',
    'agents.membership.unavailable.title': '会员服务暂未接入',
    'agents.membership.unavailable.hint': '当前客户端还没有会员服务通道，接入后即可重试。',
    'agents.membership.retry': '重试',
    'agents.membership.summary.title': '当前会员',
    'agents.membership.summary.member': '会员',
    'agents.membership.summary.guest': '未开通会员',
    'agents.membership.summary.points': '积分余额',
    'agents.membership.summary.expiresAt': '有效期至',
    'agents.membership.plans.title': '会员方案',
    'agents.membership.plans.empty': '暂未发布会员方案',
    'agents.membership.plans.current': '当前方案',
    'agents.membership.plans.recommended': '推荐',
    'agents.membership.checkout': '立即开通',
    'agents.membership.checkoutUnavailable': '暂无法发起开通',
    'agents.membership.checkoutReady': '开通链接',
    'agents.membership.checkoutClose': '关闭',
  },
};

String translateAgentsMembershipMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages = agentsMembershipMessages[tag] ??
      agentsMembershipMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

String Function(String) createAgentsMembershipTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsMembershipMessage(tag, key);
}
