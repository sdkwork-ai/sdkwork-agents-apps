import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/conversation_models.dart';
import '../state/conversation_state.dart';

/// Session list screen for the conversation capability.
///
/// Mirrors the mini program `agents-sessions` subpackage surface: select,
/// rename, and delete. Selection is reported through [onSelect] rather than by
/// pushing the chat screen, so the root keeps one navigation stack.
class AgentsConversationHistoryScreen extends StatefulWidget {
  const AgentsConversationHistoryScreen({
    super.key,
    required this.state,
    required this.onSelect,
    required this.onRename,
    required this.onDelete,
    required this.translate,
    this.onClose,
  });

  final AgentsConversationState state;
  final Future<void> Function(AgentsConversationSession session) onSelect;
  final Future<void> Function(String sessionId, String title) onRename;
  final Future<void> Function(String sessionId) onDelete;
  final String Function(String key) translate;
  final VoidCallback? onClose;

  @override
  State<AgentsConversationHistoryScreen> createState() =>
      _AgentsConversationHistoryScreenState();
}

class _AgentsConversationHistoryScreenState
    extends State<AgentsConversationHistoryScreen> {
  Future<void> _promptRename(AgentsConversationSession session) async {
    final controller = TextEditingController(text: session.title);
    final title = await showDialog<String>(
      context: context,
      builder: (BuildContext context) => AlertDialog(
        title: Text(widget.translate('agents.conversation.sessions.renameTitle')),
        content: TextField(controller: controller, autofocus: true),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(widget.translate('agents.conversation.action.cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(controller.text),
            child: Text(widget.translate('agents.conversation.action.confirm')),
          ),
        ],
      ),
    );
    controller.dispose();
    if (title != null && title.trim().isNotEmpty) {
      await widget.onRename(session.id, title);
    }
  }

  Future<void> _promptDelete(AgentsConversationSession session) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) => AlertDialog(
        content: Text(widget.translate('agents.conversation.sessions.deleteConfirm')),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(widget.translate('agents.conversation.action.cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(widget.translate('agents.conversation.sessions.delete')),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await widget.onDelete(session.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    return Scaffold(
      backgroundColor: const Color(SdkworkAgentsFlutterTokens.colorBackground),
      body: Column(
        children: <Widget>[
          SdkworkAgentsMobileAppBar(
            title: widget.translate('agents.conversation.sessions.title'),
            leading: Icons.arrow_back,
            onLeadingPressed: widget.onClose ?? () => Navigator.of(context).maybePop(),
          ),
          if (state.loadingSessions)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (state.sessions.isEmpty)
            Expanded(
              child: SdkworkAgentsEmptyState(
                headline: widget.translate('agents.conversation.sessions.empty'),
                glyph: '▣',
              ),
            )
          else
            Expanded(
              child: ListView.separated(
                itemCount: state.sessions.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (BuildContext context, int index) {
                  final session = state.sessions[index];
                  final active = session.id == state.activeSessionId;
                  return ListTile(
                    title: Text(session.title),
                    subtitle: Text(
                      DateTime.fromMillisecondsSinceEpoch(session.updatedAtMillis)
                          .toLocal()
                          .toString(),
                      style: const TextStyle(fontSize: 12),
                    ),
                    selected: active,
                    onTap: () => widget.onSelect(session),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        IconButton(
                          tooltip: widget.translate('agents.conversation.sessions.rename'),
                          onPressed: () => _promptRename(session),
                          icon: const Icon(Icons.edit_outlined, size: 18),
                        ),
                        IconButton(
                          tooltip: widget.translate('agents.conversation.sessions.delete'),
                          onPressed: () => _promptDelete(session),
                          icon: const Icon(Icons.delete_outline, size: 18),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
