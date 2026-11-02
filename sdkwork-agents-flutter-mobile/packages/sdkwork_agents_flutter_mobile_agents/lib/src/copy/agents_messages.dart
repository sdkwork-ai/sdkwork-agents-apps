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
    'agents.catalog.retry': 'Retry',
    'agents.mobile.tab.myAgents': 'My agents',
    'agents.mobile.tab.market': 'Market',
    'agents.editor.title': 'Edit agent',
    'agents.editor.name': 'Name',
    'agents.editor.description': 'Description',
    'agents.editor.save': 'Save',
    'agents.editor.saving': 'Saving',
    'agents.editor.saved': 'Agent saved.',
    'agents.editor.nameRequired': 'Enter an agent name.',
    'agents.editor.loadFailed': 'Could not load this agent.',
    'agents.editor.missing': 'This agent is no longer available.',
  },
  'zh-CN': <String, String>{
    'agents.catalog.title': '智能体',
    'agents.catalog.search.placeholder': '搜索智能体',
    'agents.catalog.loading': '加载中...',
    'agents.catalog.empty': '暂无智能体',
    'agents.catalog.loadFailed': '智能体加载失败',
    'agents.catalog.loadMore': '加载更多',
    'agents.catalog.retry': '重试',
    'agents.mobile.tab.myAgents': '我的智能体',
    'agents.mobile.tab.market': '市场',
    'agents.editor.title': '编辑 Agent',
    'agents.editor.name': '名称',
    'agents.editor.description': '描述',
    'agents.editor.save': '保存',
    'agents.editor.saving': '保存中',
    'agents.editor.saved': 'Agent 已保存。',
    'agents.editor.nameRequired': '请输入 Agent 名称。',
    'agents.editor.loadFailed': 'Agent 加载失败。',
    'agents.editor.missing': '该 Agent 已不可用。',
  },
};

String translateAgentsCatalogMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages = agentsCatalogMessages[tag] ??
      agentsCatalogMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

String Function(String) createAgentsCatalogTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsCatalogMessage(tag, key);
}
