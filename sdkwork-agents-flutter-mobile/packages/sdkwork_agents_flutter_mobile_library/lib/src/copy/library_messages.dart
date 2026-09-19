/// Library copy for the Agents Flutter mobile root.
///
/// Placement note (`I18N_SPEC.md` section 6.1): authored Flutter fragments use
/// `.arb`/`.json` under `lib/src/i18n/<locale>/<domain>/<capability>/`. These
/// `const` maps are **code-level defaults** until the `gen_l10n` projection
/// replaces them. Keys mirror the PC, H5, and mini program roots.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

const Map<String, Map<String, String>> agentsLibraryMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.library.title': 'Library',
    'agents.library.search.placeholder': 'Search the library',
    'agents.library.empty': 'Nothing in the library yet',
    'agents.library.loading': 'Loading',
    'agents.library.loadFailed': 'Failed to load the library. Please retry.',
    'agents.library.truncated': 'Many entries: showing the most recent ones',
    'agents.library.openFailed': 'Unable to open this file',
  },
  'zh-CN': <String, String>{
    'agents.library.title': '资料库',
    'agents.library.search.placeholder': '搜索资料库',
    'agents.library.empty': '资料库中还没有内容',
    'agents.library.loading': '加载中',
    'agents.library.loadFailed': '资料库加载失败，请稍后重试',
    'agents.library.truncated': '内容较多，仅展示最近的部分',
    'agents.library.openFailed': '无法打开该文件',
  },
};

String translateAgentsLibraryMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages =
      agentsLibraryMessages[tag] ?? agentsLibraryMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

String Function(String) createAgentsLibraryTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsLibraryMessage(tag, key);
}
