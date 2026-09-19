/// Projects copy for the Agents Flutter mobile root.
///
/// Placement note (`I18N_SPEC.md` section 6.1): these `const` maps are
/// **code-level defaults** until the `gen_l10n` projection replaces them. Keys
/// mirror the PC, H5, and mini program roots.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

const Map<String, Map<String, String>> agentsProjectsMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.projects.title': 'Projects',
    'agents.projects.search.placeholder': 'Search projects',
    'agents.projects.empty': 'No projects yet',
    'agents.projects.loading': 'Loading',
    'agents.projects.loadFailed': 'Failed to load projects. Please retry.',
    'agents.projects.truncated': 'Many projects: showing the most recent ones',
  },
  'zh-CN': <String, String>{
    'agents.projects.title': '项目',
    'agents.projects.search.placeholder': '搜索项目',
    'agents.projects.empty': '还没有项目',
    'agents.projects.loading': '加载中',
    'agents.projects.loadFailed': '项目加载失败，请稍后重试',
    'agents.projects.truncated': '项目较多，仅展示最近的部分',
  },
};

String translateAgentsProjectsMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages =
      agentsProjectsMessages[tag] ?? agentsProjectsMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

String Function(String) createAgentsProjectsTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsProjectsMessage(tag, key);
}
