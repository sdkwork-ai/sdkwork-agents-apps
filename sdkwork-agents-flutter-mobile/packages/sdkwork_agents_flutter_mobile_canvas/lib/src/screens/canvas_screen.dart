import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/canvas_models.dart';
import '../state/canvas_state.dart';

/// Read-only canvas route behind `app.agents.canvas.board`.
///
/// The workflow graph is browser-local to the PC canvas; this screen renders the
/// nodes in reading order without drag/connect editing.
class AgentsCanvasScreen extends StatelessWidget {
  const AgentsCanvasScreen({
    super.key,
    required this.state,
    required this.connectionsLabel,
    required this.onRefresh,
    required this.onRetry,
    required this.translate,
    this.onNavigateBack,
    this.backTooltip,
  });

  final AgentsCanvasState state;
  final String Function(int count) connectionsLabel;
  final Future<void> Function() onRefresh;
  final VoidCallback onRetry;
  final String Function(String key) translate;
  final VoidCallback? onNavigateBack;
  final String? backTooltip;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: <Widget>[
          SdkworkAgentsMobileAppBar(
            title: translate('agents.canvas.title'),
            leading: onNavigateBack == null ? null : Icons.arrow_back,
            leadingTooltip: backTooltip,
            onLeadingPressed: onNavigateBack,
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: onRefresh,
              child: _buildBody(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    if (state.loading) {
      return _scrollable(const CircularProgressIndicator());
    }
    if (state.unavailable) {
      return _scrollable(
        SdkworkAgentsUnavailableState(
          headline: translate('agents.canvas.unavailable.title'),
          hint: translate('agents.canvas.unavailable.hint'),
          retryLabel: translate('agents.canvas.retry'),
          onRetry: onRetry,
        ),
      );
    }
    if (state.errorMessage.isNotEmpty) {
      return _scrollable(
        SdkworkAgentsEmptyState(
          headline: state.errorMessage,
          glyph: '▦',
          retryLabel: translate('agents.canvas.retry'),
          onRetry: onRetry,
        ),
      );
    }
    final workflow = state.workflow;
    if (workflow == null || workflow.nodes.isEmpty) {
      return _scrollable(
        SdkworkAgentsEmptyState(
          headline: translate('agents.canvas.empty'),
          glyph: '▦',
        ),
      );
    }
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingSm,
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingLg,
      ),
      children: <Widget>[
        _ReadOnlyBanner(label: translate('agents.canvas.readOnly')),
        if (workflow.connectionCount > 0)
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 4),
            child: Text(
              connectionsLabel(workflow.connectionCount),
              style: TextStyle(
                fontSize: 11,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        for (final node in workflow.nodes) ...<Widget>[
          _CanvasNodeCard(node: node, translate: translate),
          const SizedBox(height: 8),
        ],
      ],
    );
  }

  Widget _scrollable(Widget child) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: <Widget>[
        SizedBox(height: 420, child: Center(child: child)),
      ],
    );
  }
}

class _ReadOnlyBanner extends StatelessWidget {
  const _ReadOnlyBanner({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: scheme.surfaceContainer,
        borderRadius: BorderRadius.circular(
          SdkworkAgentsFlutterTokens.radiusMd,
        ),
      ),
      child: Row(
        children: <Widget>[
          Icon(
            Icons.visibility_outlined,
            size: 14,
            color: scheme.onSurfaceVariant,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CanvasNodeCard extends StatelessWidget {
  const _CanvasNodeCard({required this.node, required this.translate});

  final AgentsCanvasNode node;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    final status = node.status;
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(
          SdkworkAgentsFlutterTokens.radiusMd,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  node.title.isEmpty
                      ? translate(node.type.labelKey)
                      : node.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: scheme.onSurface,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: scheme.surfaceContainer,
                  borderRadius: BorderRadius.circular(
                    SdkworkAgentsFlutterTokens.radiusPill,
                  ),
                ),
                child: Text(
                  translate(node.type.labelKey),
                  style: TextStyle(
                    fontSize: 10,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ),
          if (node.mediaUrl != null &&
              node.type == AgentsCanvasNodeType.imageGen)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(
                  SdkworkAgentsFlutterTokens.radiusMd,
                ),
                child: Image.network(
                  node.mediaUrl!,
                  height: 160,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder:
                      (BuildContext context, Object error, StackTrace? stack) =>
                          const SizedBox.shrink(),
                ),
              ),
            ),
          if (node.body.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                node.body,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  height: 1.5,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ),
          if (status != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                translate(status.labelKey),
                style: TextStyle(
                  fontSize: 10,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
