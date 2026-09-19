/// Conversation copy for the Agents Flutter mobile root.
///
/// Placement note (`I18N_SPEC.md` section 6.1): authored Flutter fragments use
/// `.arb`/`.json` under `lib/src/i18n/<locale>/<domain>/<capability>/`. A Dart
/// `const` map is not an authored fragment format, so the maps below are
/// **code-level defaults** and live outside `lib/src/i18n/` until the `gen_l10n`
/// projection (which requires the Flutter toolchain) replaces them.
///
/// Keys are the same literals the PC, H5, and mini program roots declare, so a
/// key means the same thing on every client.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

const Map<String, Map<String, String>> agentsConversationMessages =
    <String, Map<String, String>>{
  'en-US': <String, String>{
    'agents.conversation.title': 'Tasks',
    'agents.conversation.empty.greeting': 'SDKWork Agents, at your service',
    'agents.conversation.empty.hint':
        'Describe your goal and I will break it down and execute.',
    'agents.conversation.composer.placeholder': 'Send a message',
    'agents.conversation.composer.send': 'Send',
    'agents.conversation.composer.stop': 'Stop generating',
    'agents.conversation.composer.voiceUnavailable':
        'Voice input is not wired in this runtime',
    'agents.conversation.actions.newSession': 'New chat',
    'agents.conversation.actions.history': 'Chat history',
    'agents.conversation.sessions.title': 'Chats',
    'agents.conversation.sessions.empty': 'No chats yet',
    'agents.conversation.sessions.untitled': 'Untitled chat',
    'agents.conversation.sessions.rename': 'Rename',
    'agents.conversation.sessions.delete': 'Delete',
    'agents.conversation.sessions.deleteConfirm':
        'Delete this chat and its transcript?',
    'agents.conversation.sessions.renameTitle': 'Chat name',
    'agents.conversation.reasoning.title': 'Thinking',
    'agents.conversation.tool.running': 'Running',
    'agents.conversation.tool.completed': 'Done',
    'agents.conversation.tool.failed': 'Failed',
    'agents.conversation.status.sending': 'Replying',
    'agents.conversation.status.loading': 'Loading',
    'agents.conversation.error.send': 'Message failed to send, please retry',
    'agents.conversation.error.loadSessions': 'Failed to load chats',
    'agents.conversation.error.loadMessages': 'Failed to load messages',
    'agents.conversation.action.cancel': 'Cancel',
    'agents.conversation.action.confirm': 'Confirm',
    'agents.conversation.action.retry': 'Retry',
  },
  'zh-CN': <String, String>{
    'agents.conversation.title': '任务',
    'agents.conversation.empty.greeting': 'SDKWork Agents，我帮你',
    'agents.conversation.empty.hint': '直接描述你的目标，我会拆解并执行。',
    'agents.conversation.composer.placeholder': '发消息',
    'agents.conversation.composer.send': '发送',
    'agents.conversation.composer.stop': '停止生成',
    'agents.conversation.composer.voiceUnavailable': '当前运行环境未接入语音输入',
    'agents.conversation.actions.newSession': '新建对话',
    'agents.conversation.actions.history': '会话历史',
    'agents.conversation.sessions.title': '会话',
    'agents.conversation.sessions.empty': '暂无历史会话',
    'agents.conversation.sessions.untitled': '未命名对话',
    'agents.conversation.sessions.rename': '重命名',
    'agents.conversation.sessions.delete': '删除',
    'agents.conversation.sessions.deleteConfirm': '删除该对话及其记录？',
    'agents.conversation.sessions.renameTitle': '对话名称',
    'agents.conversation.reasoning.title': '思考过程',
    'agents.conversation.tool.running': '调用中',
    'agents.conversation.tool.completed': '已完成',
    'agents.conversation.tool.failed': '调用失败',
    'agents.conversation.status.sending': '正在回复',
    'agents.conversation.status.loading': '加载中',
    'agents.conversation.error.send': '消息发送失败，请重试',
    'agents.conversation.error.loadSessions': '会话列表加载失败',
    'agents.conversation.error.loadMessages': '消息加载失败',
    'agents.conversation.action.cancel': '取消',
    'agents.conversation.action.confirm': '确认',
    'agents.conversation.action.retry': '重试',
  },
};

/// Translates a conversation key for [localeTag], falling back to the key.
String translateAgentsConversationMessage(String localeTag, String key) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  final messages = agentsConversationMessages[tag] ??
      agentsConversationMessages[sdkworkAgentsDefaultLocaleTag]!;
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : key;
}

/// Builds the translator closure a screen or controller expects.
String Function(String) createAgentsConversationTranslator(String localeTag) {
  final tag = resolveSdkworkAgentsLocaleTag(localeTag);
  return (String key) => translateAgentsConversationMessage(tag, key);
}
