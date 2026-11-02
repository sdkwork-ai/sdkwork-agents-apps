import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/conversation_models.dart';
import '../state/conversation_state.dart';

/// Route-level conversation screen.
///
/// Mirrors the H5/mini program chat surface: a compact header, a transcript
/// with collapsible reasoning and first-class tool cards, and a composer. The
/// root shell mounts it; the screen owns only presentation
/// (`FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` section 4 — `screens/`).
class AgentsConversationChatScreen extends StatefulWidget {
  const AgentsConversationChatScreen({
    super.key,
    required this.state,
    required this.onSend,
    required this.onNewSession,
    required this.onOpenHistory,
    required this.translate,
    this.profileAction,
  });

  final AgentsConversationState state;
  final Future<void> Function(String content) onSend;
  final VoidCallback onNewSession;
  final VoidCallback onOpenHistory;
  final String Function(String key) translate;

  /// Accessible avatar action that opens the profile hub.
  final Widget? profileAction;

  @override
  State<AgentsConversationChatScreen> createState() =>
      _AgentsConversationChatScreenState();
}

class _AgentsConversationChatScreenState
    extends State<AgentsConversationChatScreen> {
  final TextEditingController _composer = TextEditingController();
  final ScrollController _scroll = ScrollController();

  @override
  void didUpdateWidget(AgentsConversationChatScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.state.messages.length != widget.state.messages.length) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    }
  }

  @override
  void dispose() {
    _composer.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (!_scroll.hasClients) {
      return;
    }
    _scroll.animateTo(
      _scroll.position.maxScrollExtent,
      duration: const Duration(milliseconds: 160),
      curve: Curves.easeOut,
    );
  }

  Future<void> _submit() async {
    final content = _composer.text;
    if (content.trim().isEmpty) {
      return;
    }
    _composer.clear();
    await widget.onSend(content);
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: <Widget>[
          SdkworkAgentsMobileAppBar(
            title: 'SDKWork Agents',
            subtitle: state.activeSessionTitle.isEmpty
                ? null
                : state.activeSessionTitle,
            leading: Icons.history,
            leadingTooltip:
                widget.translate('agents.conversation.actions.history'),
            onLeadingPressed: widget.onOpenHistory,
            actions: <Widget>[
              SdkworkAgentsMobileAppBarAction(
                icon: Icons.add,
                tooltip:
                    widget.translate('agents.conversation.actions.newSession'),
                onPressed: widget.onNewSession,
              ),
              if (widget.profileAction != null) widget.profileAction!,
            ],
          ),
          Expanded(
            child: state.loadingMessages
                ? const Center(child: CircularProgressIndicator())
                : state.hasMessages
                    ? ListView.builder(
                        controller: _scroll,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        itemCount: state.messages.length,
                        itemBuilder: (BuildContext context, int index) =>
                            _ConversationMessageRow(
                          message: state.messages[index],
                          reasoningTitle: widget
                              .translate('agents.conversation.reasoning.title'),
                        ),
                      )
                    : SdkworkAgentsEmptyState(
                        headline: widget
                            .translate('agents.conversation.empty.greeting'),
                        hint:
                            widget.translate('agents.conversation.empty.hint'),
                      ),
          ),
          _ConversationComposer(
            controller: _composer,
            streaming: state.streaming,
            translate: widget.translate,
            onSubmit: _submit,
          ),
        ],
      ),
    );
  }
}

class _ConversationComposer extends StatelessWidget {
  const _ConversationComposer({
    required this.controller,
    required this.streaming,
    required this.translate,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final bool streaming;
  final String Function(String key) translate;
  final Future<void> Function() onSubmit;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    final TechBlueThemeColors colors = techBlueThemeColors(context);
    return Material(
      color: scheme.surface,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            SdkworkAgentsFlutterTokens.spacingSm,
            SdkworkAgentsFlutterTokens.spacingSm,
            SdkworkAgentsFlutterTokens.spacingSm,
            SdkworkAgentsFlutterTokens.spacingSm,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: <Widget>[
              IconButton(
                tooltip:
                    translate('agents.conversation.composer.voiceUnavailable'),
                color: colors.iconDefault,
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(translate(
                          'agents.conversation.composer.voiceUnavailable')),
                    ),
                  );
                },
                icon: const Icon(Icons.mic_none),
              ),
              Expanded(
                child: TextField(
                  controller: controller,
                  minLines: 1,
                  maxLines: 5,
                  textInputAction: TextInputAction.newline,
                  decoration: InputDecoration(
                    hintText:
                        translate('agents.conversation.composer.placeholder'),
                  ),
                ),
              ),
              const SizedBox(width: 4),
              IconButton.filled(
                tooltip: streaming
                    ? translate('agents.conversation.composer.stop')
                    : translate('agents.conversation.composer.send'),
                // The glyph colour is explicit: `IconButton.filled` resolves
                // its foreground through the variant defaults, so inheriting
                // it here rendered the paper-plane dark grey on the blue disc.
                style: IconButton.styleFrom(
                  backgroundColor: const Color(
                    SdkworkAgentsFlutterTokens.colorPrimary,
                  ),
                  foregroundColor: colors.iconOnPrimary,
                  disabledBackgroundColor: const Color(
                    SdkworkAgentsFlutterTokens.colorPrimary,
                  ),
                  disabledForegroundColor: colors.iconOnPrimary,
                ),
                onPressed: streaming ? null : () => onSubmit(),
                icon: Icon(
                  streaming ? Icons.hourglass_top : Icons.send,
                  color: colors.iconOnPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConversationMessageRow extends StatelessWidget {
  const _ConversationMessageRow(
      {required this.message, required this.reasoningTitle});

  final AgentsConversationMessage message;
  final String reasoningTitle;

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    final ColorScheme scheme = Theme.of(context).colorScheme;
    final TechBlueThemeColors colors = techBlueThemeColors(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Column(
        crossAxisAlignment:
            isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: <Widget>[
          if (message.hasReasoning)
            _ReasoningBlock(text: message.reasoning!, title: reasoningTitle),
          if (message.hasToolCalls) _ToolCallList(calls: message.toolCalls),
          ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.sizeOf(context).width * 0.78,
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isUser ? scheme.primary : scheme.surface,
                borderRadius: BorderRadius.circular(
                  SdkworkAgentsFlutterTokens.radiusMd,
                ),
              ),
              child: Text(
                message.streaming && message.text.isEmpty
                    ? '▍'
                    : (message.streaming ? '${message.text}▍' : message.text),
                style: TextStyle(
                  fontSize: 14,
                  height: 1.45,
                  color: isUser ? scheme.onPrimary : scheme.onSurface,
                ),
              ),
            ),
          ),
          if ((message.error ?? '').isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                message.error!,
                style: TextStyle(
                  fontSize: 12,
                  color: colors.dangerText,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ReasoningBlock extends StatelessWidget {
  const _ReasoningBlock({required this.text, required this.title});

  final String text;
  final String title;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        childrenPadding: const EdgeInsets.only(bottom: 8),
        iconColor: scheme.onSurfaceVariant,
        collapsedIconColor: scheme.onSurfaceVariant,
        title: Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: scheme.onSurfaceVariant,
          ),
        ),
        children: <Widget>[
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              text,
              style: TextStyle(
                fontSize: 12,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToolCallList extends StatelessWidget {
  const _ToolCallList({required this.calls});

  final List<AgentsConversationToolCall> calls;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    final TechBlueThemeColors colors = techBlueThemeColors(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        for (final call in calls)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Icon(
                  _iconFor(call.status),
                  size: 14,
                  color: _colorFor(call.status, scheme, colors),
                ),
                const SizedBox(width: 6),
                Text(
                  call.name ?? call.id,
                  style: TextStyle(
                    fontSize: 12,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  static IconData _iconFor(AgentsConversationToolStatus status) {
    switch (status) {
      case AgentsConversationToolStatus.running:
        return Icons.autorenew;
      case AgentsConversationToolStatus.completed:
        return Icons.check_circle_outline;
      case AgentsConversationToolStatus.error:
        return Icons.error_outline;
    }
  }

  static Color _colorFor(
    AgentsConversationToolStatus status,
    ColorScheme scheme,
    TechBlueThemeColors colors,
  ) {
    switch (status) {
      case AgentsConversationToolStatus.running:
        return scheme.onSurfaceVariant;
      case AgentsConversationToolStatus.completed:
        return scheme.primary;
      case AgentsConversationToolStatus.error:
        return colors.dangerText;
    }
  }
}
