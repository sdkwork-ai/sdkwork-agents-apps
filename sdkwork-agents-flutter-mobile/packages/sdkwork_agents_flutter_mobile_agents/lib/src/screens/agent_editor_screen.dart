import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../state/agent_editor_state.dart';

/// Agent editor route behind `app.agents.catalog.editor`.
///
/// Edits the display name and description through the injected catalog
/// service; loading, missing, error, saving, and saved states are localized.
class AgentsEditorScreen extends StatefulWidget {
  const AgentsEditorScreen({
    super.key,
    required this.state,
    required this.onNameChanged,
    required this.onDescriptionChanged,
    required this.onSave,
    required this.onRetry,
    required this.translate,
    this.onNavigateBack,
    this.backTooltip,
  });

  final AgentsEditorState state;
  final ValueChanged<String> onNameChanged;
  final ValueChanged<String> onDescriptionChanged;
  final Future<void> Function() onSave;
  final VoidCallback onRetry;
  final String Function(String key) translate;
  final VoidCallback? onNavigateBack;
  final String? backTooltip;

  @override
  State<AgentsEditorScreen> createState() => _AgentsEditorScreenState();
}

class _AgentsEditorScreenState extends State<AgentsEditorScreen> {
  late final TextEditingController _name =
      TextEditingController(text: widget.state.name);
  late final TextEditingController _description =
      TextEditingController(text: widget.state.description);

  @override
  void didUpdateWidget(covariant AgentsEditorScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_name.text != widget.state.name) {
      _name.text = widget.state.name;
    }
    if (_description.text != widget.state.description) {
      _description.text = widget.state.description;
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: <Widget>[
          SdkworkAgentsMobileAppBar(
            title: widget.translate('agents.editor.title'),
            leading: widget.onNavigateBack == null ? null : Icons.arrow_back,
            leadingTooltip: widget.backTooltip,
            onLeadingPressed: widget.onNavigateBack,
          ),
          Expanded(child: _buildBody(context)),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    final state = widget.state;
    final ColorScheme scheme = Theme.of(context).colorScheme;
    final TechBlueThemeColors colors = techBlueThemeColors(context);
    if (state.loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.missing || state.errorMessage.isNotEmpty && state.item == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(SdkworkAgentsFlutterTokens.spacingLg),
          child: SdkworkAgentsEmptyState(
            headline: state.errorMessage.isEmpty
                ? widget.translate('agents.editor.missing')
                : state.errorMessage,
            glyph: '✎',
            retryLabel: widget.translate('agents.catalog.retry'),
            onRetry: widget.onRetry,
          ),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(SdkworkAgentsFlutterTokens.spacingMd),
      children: <Widget>[
        TextField(
          controller: _name,
          decoration: InputDecoration(
            labelText: widget.translate('agents.editor.name'),
          ),
          textInputAction: TextInputAction.next,
          onChanged: widget.onNameChanged,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _description,
          decoration: InputDecoration(
            labelText: widget.translate('agents.editor.description'),
            alignLabelWithHint: true,
          ),
          minLines: 4,
          maxLines: 8,
          onChanged: widget.onDescriptionChanged,
        ),
        if (state.errorMessage.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              state.errorMessage,
              style: TextStyle(
                color: colors.dangerText,
                fontSize: 12,
              ),
            ),
          ),
        if (state.saved)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              widget.translate('agents.editor.saved'),
              style: TextStyle(
                color: scheme.primary,
                fontSize: 12,
              ),
            ),
          ),
        const SizedBox(height: 20),
        SizedBox(
          height: 48,
          child: FilledButton(
            onPressed: state.saving ? null : () => widget.onSave(),
            child: Text(
              state.saving
                  ? widget.translate('agents.editor.saving')
                  : widget.translate('agents.editor.save'),
            ),
          ),
        ),
      ],
    );
  }
}
