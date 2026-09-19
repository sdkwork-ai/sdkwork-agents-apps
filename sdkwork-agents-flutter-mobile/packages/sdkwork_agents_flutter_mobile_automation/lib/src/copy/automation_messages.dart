/// Automation copy for the Agents Flutter mobile root.
///
/// Placement note (`I18N_SPEC.md` section 6.1): these `const` maps are
/// **code-level defaults** until the `gen_l10n` projection replaces them. Keys
/// mirror the PC, H5, and mini program roots.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

const Map<String, Map<String, String>> agentsAutomationMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.automation.title': 'Automation',
    'agents.automation.search.placeholder': 'Search automations',
    'agents.automation.empty': 'No automations yet',
    'agents.automation.loading': 'Loading',
    'agents.automation.loadFailed': 'Failed to load automations. Please retry.',
    'agents.automation.truncated': 'Many tasks: showing the most recent ones',
    'agents.automation.status.active': 'Running',
    'agents.automation.status.paused': 'Paused',
    'agents.automation.status.completed': 'Completed',
    'agents.automation.status.cancelled': 'Cancelled',
  },
  'zh-CN': <String, String>{
    'agents.automation.title': '自动化',
    'agents.automation.search.placeholder': '搜索自动化任务',
    'agents.automation.empty': '还没有自动化任务',
    'agents.automation.loading': '加载中',
    'agents.automation.loadFailed': '自动化任务加载失败，请稍后重试',
    'agents.automation.truncated': '任务较多，仅展示最近的部分',
    'agents.automation.status.active': '运行中',
    'agents.automation.status.paused': '已暂停',
    'agents.automation.status.completed': '已完成',
    'agents.automation.status.cancelled': '已取消',
  },
};

String translateAgentsAutomationMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages = agentsAutomationMessages[tag] ??
      agentsAutomationMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

String Function(String) createAgentsAutomationTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsAutomationMessage(tag, key);
}
