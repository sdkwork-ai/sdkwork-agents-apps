/// Profile hub and settings copy for the Agents Flutter mobile root.
///
/// Code-level defaults in the same shape as the existing capability packages;
/// every key is present in `zh-CN` and `en-US`.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

const Map<String, Map<String, String>> agentsProfileMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.profile.title': 'Profile',
    'agents.profile.signedInTitle': 'Signed-in account',
    'agents.profile.signedOutTitle': 'Not signed in',
    'agents.profile.signedInHint': 'This session is authorized',
    'agents.profile.signedOutHint': 'Install an access token to use the app',
    'agents.profile.accountLabel': 'Account',
    'agents.profile.localeLabel': 'Language',
    'agents.profile.loading': 'Loading profile',
    'agents.profile.loadFailed': 'Failed to load the profile. Please retry.',
    'agents.profile.retry': 'Retry',
    'agents.profile.usage.title': 'Usage',
    'agents.profile.usage.turns': '{{count}} turns',
    'agents.profile.usage.tokens': '{{count}} tokens',
    'agents.profile.usage.unavailable': 'Usage is unavailable',
    'agents.profile.links.title': 'More',
    'agents.profile.link.membership': 'Membership',
    'agents.profile.link.projects': 'Projects',
    'agents.profile.link.library': 'Library',
    'agents.profile.link.automation': 'Automation',
    'agents.profile.link.history': 'Chat history',
    'agents.profile.link.settings': 'Settings',
    'agents.settings.title': 'Settings',
    'agents.settings.loading': 'Loading settings',
    'agents.settings.loadFailed': 'Failed to load settings. Please retry.',
    'agents.settings.language': 'Language',
    'agents.settings.language.zhCn': 'Chinese (Simplified)',
    'agents.settings.language.enUs': 'English',
    'agents.settings.theme': 'Theme',
    'agents.settings.theme.system': 'Follow system',
    'agents.settings.theme.light': 'Light',
    'agents.settings.theme.dark': 'Dark',
    'agents.settings.notifications': 'Notifications',
    'agents.settings.notifications.hint': 'Receive generation and task updates',
    'agents.settings.autoplay': 'Autoplay',
    'agents.settings.autoplay.hint': 'Play generated media automatically',
    'agents.settings.save': 'Save',
    'agents.settings.saving': 'Saving',
    'agents.settings.saved': 'Settings saved',
    'agents.settings.saveFailed': 'Failed to save settings. Please retry.',
    'agents.settings.retry': 'Retry',
  },
  'zh-CN': <String, String>{
    'agents.profile.title': '我的',
    'agents.profile.signedInTitle': '已登录账户',
    'agents.profile.signedOutTitle': '未登录',
    'agents.profile.signedInHint': '当前会话已授权',
    'agents.profile.signedOutHint': '安装访问令牌后即可使用',
    'agents.profile.accountLabel': '当前账号',
    'agents.profile.localeLabel': '语言',
    'agents.profile.loading': '个人资料加载中',
    'agents.profile.loadFailed': '个人资料加载失败，请稍后重试',
    'agents.profile.retry': '重试',
    'agents.profile.usage.title': '本月用量',
    'agents.profile.usage.turns': '{{count}} 轮对话',
    'agents.profile.usage.tokens': '{{count}} tokens',
    'agents.profile.usage.unavailable': '用量服务暂不可用',
    'agents.profile.links.title': '更多',
    'agents.profile.link.membership': '会员',
    'agents.profile.link.projects': '项目',
    'agents.profile.link.library': '资料库',
    'agents.profile.link.automation': '自动化',
    'agents.profile.link.history': '会话历史',
    'agents.profile.link.settings': '设置',
    'agents.settings.title': '设置',
    'agents.settings.loading': '设置加载中',
    'agents.settings.loadFailed': '设置加载失败，请稍后重试',
    'agents.settings.language': '语言',
    'agents.settings.language.zhCn': '简体中文',
    'agents.settings.language.enUs': 'English',
    'agents.settings.theme': '主题',
    'agents.settings.theme.system': '跟随系统',
    'agents.settings.theme.light': '浅色',
    'agents.settings.theme.dark': '深色',
    'agents.settings.notifications': '接收通知',
    'agents.settings.notifications.hint': '接收生成任务与自动化提醒',
    'agents.settings.autoplay': '自动播放',
    'agents.settings.autoplay.hint': '自动播放生成结果',
    'agents.settings.save': '保存',
    'agents.settings.saving': '保存中',
    'agents.settings.saved': '设置已保存',
    'agents.settings.saveFailed': '设置保存失败，请稍后重试',
    'agents.settings.retry': '重试',
  },
};

String translateAgentsProfileMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages = agentsProfileMessages[tag] ??
      agentsProfileMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

String Function(String) createAgentsProfileTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsProfileMessage(tag, key);
}
