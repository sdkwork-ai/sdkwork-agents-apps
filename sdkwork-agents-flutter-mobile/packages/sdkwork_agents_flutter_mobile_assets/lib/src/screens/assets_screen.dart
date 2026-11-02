import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

import '../models/assets_models.dart';
import '../state/assets_state.dart';

/// Route-level asset library screen.
///
/// Shows a date-grouped grid with a kind filter and a details bottom sheet. The
/// empty, error, loading, and explicit unavailable states are all localized.
class AgentsAssetsScreen extends StatelessWidget {
  const AgentsAssetsScreen({
    super.key,
    required this.state,
    required this.groups,
    required this.groupLabel,
    required this.onKindChanged,
    required this.onRefresh,
    required this.onRetry,
    required this.translate,
    this.profileAction,
  });

  final AgentsAssetsState state;
  final List<AgentsAssetGroup> groups;
  final String Function(String dateKey) groupLabel;
  final ValueChanged<AgentsAssetKind?> onKindChanged;
  final Future<void> Function() onRefresh;
  final VoidCallback onRetry;
  final String Function(String key) translate;

  /// Accessible avatar action that opens the profile hub.
  final Widget? profileAction;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: <Widget>[
          SdkworkAgentsMobileAppBar(
            title: translate('agents.assets.title'),
            actions: <Widget>[
              if (profileAction != null) profileAction!,
            ],
          ),
          _AssetKindFilter(
            selected: state.kind,
            onChanged: onKindChanged,
            translate: translate,
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
      return _scrollableCentered(const CircularProgressIndicator());
    }
    if (state.unavailable) {
      return _scrollableCentered(
        SdkworkAgentsUnavailableState(
          headline: translate('agents.assets.unavailable.title'),
          hint: translate('agents.assets.unavailable.hint'),
          retryLabel: translate('agents.assets.retry'),
          onRetry: onRetry,
        ),
      );
    }
    if (state.errorMessage.isNotEmpty) {
      return _scrollableCentered(
        SdkworkAgentsEmptyState(
          headline: state.errorMessage,
          glyph: '▤',
          onRetry: onRetry,
          retryLabel: translate('agents.assets.retry'),
        ),
      );
    }
    if (groups.isEmpty) {
      return _scrollableCentered(
        SdkworkAgentsEmptyState(
          headline: state.kind == null
              ? translate('agents.assets.empty')
              : translate('agents.assets.emptyFiltered'),
          glyph: '▤',
          onRetry: onRetry,
          retryLabel: translate('agents.assets.retry'),
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
        for (final group in groups) ...<Widget>[
          _GroupHeader(
            label: groupLabel(group.dateKey),
            countLabel:
                '${group.items.length} ${translate('agents.assets.itemCount')}',
          ),
          const SizedBox(height: 8),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: group.items.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
            ),
            itemBuilder: (BuildContext context, int index) {
              final item = group.items[index];
              return _AssetTile(
                item: item,
                translate: translate,
                onTap: () => Navigator.of(context).pushNamed(
                  agentsAssetsDetailRouteName,
                  arguments: item,
                ),
              );
            },
          ),
          const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
        ],
      ],
    );
  }

  Widget _scrollableCentered(Widget child) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: <Widget>[
        SizedBox(height: 420, child: Center(child: child)),
      ],
    );
  }
}

class _AssetKindFilter extends StatelessWidget {
  const _AssetKindFilter({
    required this.selected,
    required this.onChanged,
    required this.translate,
  });

  final AgentsAssetKind? selected;
  final ValueChanged<AgentsAssetKind?> onChanged;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
          horizontal: SdkworkAgentsFlutterTokens.spacingMd,
          vertical: 4,
        ),
        children: <Widget>[
          FilterChip(
            label: Text(translate('agents.assets.filter.all')),
            selected: selected == null,
            onSelected: (_) => onChanged(null),
            materialTapTargetSize: MaterialTapTargetSize.padded,
          ),
          const SizedBox(width: 8),
          for (final kind in AgentsAssetKind.values) ...<Widget>[
            FilterChip(
              label: Text(translate(kind.labelKey)),
              selected: selected == kind,
              onSelected: (_) => onChanged(kind),
              materialTapTargetSize: MaterialTapTargetSize.padded,
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _GroupHeader extends StatelessWidget {
  const _GroupHeader({required this.label, required this.countLabel});

  final String label;
  final String countLabel;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Row(
      children: <Widget>[
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: scheme.onSurface,
            ),
          ),
        ),
        Text(
          countLabel,
          style: TextStyle(
            fontSize: 11,
            color: scheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _AssetTile extends StatelessWidget {
  const _AssetTile({
    required this.item,
    required this.translate,
    required this.onTap,
  });

  final AgentsAssetItem item;
  final String Function(String key) translate;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final kindLabel = translate(item.kind.labelKey);
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      image: item.kind == AgentsAssetKind.image,
      label: kindLabel,
      child: Material(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(
          SdkworkAgentsFlutterTokens.radiusMd,
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: item.hasPreview && item.kind == AgentsAssetKind.image
              ? Image.network(
                  item.sourceUrl!,
                  fit: BoxFit.cover,
                  errorBuilder:
                      (BuildContext context, Object error, StackTrace? stack) =>
                          _TileFallback(label: kindLabel),
                )
              : _TileFallback(label: kindLabel),
        ),
      ),
    );
  }
}

class _TileFallback extends StatelessWidget {
  const _TileFallback({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(
            Icons.perm_media_outlined,
            size: 22,
            color: scheme.onSurfaceVariant,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 10,
              color: scheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// Bottom sheet with the persisted asset metadata.
class AgentsAssetDetailSheet extends StatelessWidget {
  const AgentsAssetDetailSheet({
    super.key,
    required this.item,
    required this.translate,
  });

  final AgentsAssetItem item;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    final createdAt = item.createdAt;
    final toolId = item.toolId;
    final driveUri = item.driveUri;
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.85,
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            SdkworkAgentsFlutterTokens.spacingMd,
            0,
            SdkworkAgentsFlutterTokens.spacingMd,
            SdkworkAgentsFlutterTokens.spacingMd,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                translate('agents.assets.detail.title'),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: scheme.onSurface,
                ),
              ),
              const SizedBox(height: 12),
              if (item.hasPreview && item.kind == AgentsAssetKind.image)
                ClipRRect(
                  borderRadius: BorderRadius.circular(
                    SdkworkAgentsFlutterTokens.radiusMd,
                  ),
                  child: Image.network(
                    item.sourceUrl!,
                    height: 220,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (BuildContext context, Object error,
                            StackTrace? stack) =>
                        _DetailPreviewFallback(
                      label: translate('agents.assets.previewUnavailable'),
                    ),
                  ),
                )
              else
                _DetailPreviewFallback(
                  label: translate('agents.assets.previewUnavailable'),
                ),
              const SizedBox(height: 12),
              _DetailRow(
                label: translate('agents.assets.detail.kind'),
                value: translate(item.kind.labelKey),
              ),
              if (createdAt != null && createdAt.isNotEmpty)
                _DetailRow(
                  label: translate('agents.assets.detail.createdAt'),
                  value: createdAt,
                ),
              if (toolId != null && toolId.isNotEmpty)
                _DetailRow(
                  label: translate('agents.assets.detail.tool'),
                  value: toolId,
                ),
              if (driveUri != null && driveUri.isNotEmpty)
                _DetailRow(
                  label: translate('agents.assets.detail.driveUri'),
                  value: driveUri,
                ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text(translate('agents.assets.detail.close')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailPreviewFallback extends StatelessWidget {
  const _DetailPreviewFallback({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Container(
      height: 160,
      width: double.infinity,
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(
          SdkworkAgentsFlutterTokens.radiusMd,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          color: scheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          SizedBox(
            width: 88,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 13,
                color: scheme.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
