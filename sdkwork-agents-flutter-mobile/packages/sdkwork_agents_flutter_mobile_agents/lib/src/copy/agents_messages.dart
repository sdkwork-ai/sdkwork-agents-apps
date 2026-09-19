/// Catalog copy for the Agents Flutter mobile root.
///
/// Placement note (`I18N_SPEC.md` section 6.1): authored Flutter fragments use
/// `.arb`/`.json` under `lib/src/i18n/<locale>/<domain>/<capability>/`. A Dart
/// `const` map is not an authored fragment format, so the maps below are
/// **code-level defaults** and live outside `lib/src/i18n/` until the `gen_l10n`
/// projection (which requires the Flutter toolchain) replaces them.
///
/// Keys mirror the PC, H5, and mini program roots.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

const Map<String, Map<String, String>> agentsCatalogMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.catalog.title': 'Agents',
    'agents.catalog.search.placeholder': 'Search agents',
    'agents.catalog.loading': 'Loading...',
    'agents.catalog.empty': 'No agents yet',
    'agents.catalog.loadFailed': 'Failed to load agents',
    'agents.catalog.loadMore': 'Load more',
  },
  'zh-CN': <String, String>{
    'agents.catalog.title': '智能体',
    'agents.catalog.search.placeholder': '搜索智能体',
    'agents.catalog.loading': '加载中...',
    'agents.catalog.empty': '暂无智能体',
    'agents.catalog.loadFailed': '智能体加载失败',
    'agents.catalog.loadMore': '加载更多',
  },
};

String translateAgentsCatalogMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages =
      agentsCatalogMessages[tag] ?? agentsCatalogMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

String Function(String) createAgentsCatalogTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsCatalogMessage(tag, key);
}
