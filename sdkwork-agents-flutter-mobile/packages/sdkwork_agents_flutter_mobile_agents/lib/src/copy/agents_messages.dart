/// Package-local default copy for the agents capability.
///
/// Placement note (`I18N_SPEC.md` section 6.1): Flutter authored fragments use
/// `.arb`/`.json` under `lib/src/i18n/<locale>/<domain>/<capability>/`. Dart
/// `const` maps are not an authored fragment format, so they are classified as
/// code-level defaults and live outside `lib/src/i18n/` until the `gen_l10n`
/// projection (which needs the Flutter toolchain) replaces them.
const Map<String, String> agentsMessagesEnUs = <String, String>{
  'agents.catalog.title': 'Agents',
  'agents.catalog.loading': 'Loading...',
  'agents.catalog.empty': 'No agents yet',
  'agents.catalog.loadFailed': 'Failed to load agents',
};

const Map<String, String> agentsMessagesZhCn = <String, String>{
  'agents.catalog.title': '智能体',
  'agents.catalog.loading': '加载中...',
  'agents.catalog.empty': '暂无智能体',
  'agents.catalog.loadFailed': '智能体加载失败',
};
