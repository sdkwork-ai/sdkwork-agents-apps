/// Shared shell copy for the Agents Flutter mobile root.
///
/// Placement note (`I18N_SPEC.md` section 6.1): the authored Flutter fragment
/// layout is `lib/src/i18n/<locale>/<domain>/<capability>/<fragment>.arb|.json`.
/// A Dart `const` map is not an authored fragment format, so the maps below are
/// classified as **code-level defaults** and live outside `lib/src/i18n/` until
/// the `gen_l10n` projection (which requires the Flutter toolchain) replaces
/// them. Keys are shared verbatim with the PC, H5, mini program, and HarmonyOS
/// roots so a key means the same thing on every client.
library;

import 'locale_helpers.dart';

/// Bottom-tab labels and shell chrome, keyed by canonical locale tag then
/// message key.
const Map<String, Map<String, String>> sdkworkAgentsShellMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.mobile.tab.tasks': 'Chat',
    'agents.mobile.tab.inspiration': 'Inspiration',
    'agents.mobile.tab.creative': 'Create',
    'agents.mobile.tab.assets': 'Assets',
    'agents.mobile.tab.experts': 'Agent',
    'agents.mobile.tab.library': 'Library',
    'agents.mobile.tab.automation': 'Automation',
    'agents.mobile.tab.projects': 'Projects',
    'agents.mobile.tab.membership': 'Membership',
    'agents.mobile.tab.profile': 'Profile',
    'agents.mobile.tab.canvas': 'Canvas',
    'agents.mobile.tab.market': 'Market',
    'agents.mobile.tab.myAgents': 'My agents',
    'agents.mobile.shell.menu': 'Open navigation',
    'agents.mobile.shell.profile': 'My profile',
    'agents.mobile.shell.back': 'Back',
    'agents.mobile.shell.newChat': 'New chat',
    'agents.auth.title': 'SDKWork Agents',
    'agents.auth.tokenRequired': 'No access token is installed. Launch with '
        '--dart-define=SDKWORK_ACCESS_TOKEN=<token>, or call '
        'AgentsAuthSession.install() from the host bridge.',
  },
  'zh-CN': <String, String>{
    'agents.mobile.tab.tasks': '对话',
    'agents.mobile.tab.inspiration': '灵感',
    'agents.mobile.tab.creative': '生成',
    'agents.mobile.tab.assets': '资产',
    'agents.mobile.tab.experts': 'Agent',
    'agents.mobile.tab.library': '资料库',
    'agents.mobile.tab.automation': '自动化',
    'agents.mobile.tab.projects': '项目',
    'agents.mobile.tab.membership': '会员',
    'agents.mobile.tab.profile': '我的',
    'agents.mobile.tab.canvas': '画布',
    'agents.mobile.tab.market': '市场',
    'agents.mobile.tab.myAgents': '我的智能体',
    'agents.mobile.shell.menu': '打开导航',
    'agents.mobile.shell.profile': '我的',
    'agents.mobile.shell.back': '返回',
    'agents.mobile.shell.newChat': '新建对话',
    'agents.auth.title': 'SDKWork Agents',
    'agents.auth.tokenRequired': '尚未安装访问令牌。请使用 '
        '--dart-define=SDKWORK_ACCESS_TOKEN=<token> 启动，或由宿主桥接调用 '
        'AgentsAuthSession.install()。',
  },
};

/// Looks a shell key up for a locale tag, falling back to en-US then the key.
String translateSdkworkAgentsShellMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages = sdkworkAgentsShellMessages[tag] ??
      sdkworkAgentsShellMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

/// Builds the translator closure the shell frame expects.
String Function(String) createSdkworkAgentsShellTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateSdkworkAgentsShellMessage(tag, key);
}
