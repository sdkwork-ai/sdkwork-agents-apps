import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/inspiration_models.dart';
import '../state/inspiration_state.dart';

/// Route-level inspiration screen.
///
/// Renders the 发现/精选 feed, pull-to-refresh, and the loading, empty, error,
/// and explicit unavailable states. Every string comes from the translator; the
/// screen never invents feed content.
class AgentsInspirationScreen extends StatelessWidget {
  const AgentsInspirationScreen({
    super.key,
    required this.state,
    required this.items,
    required this.onChannelChanged,
    required this.onRefresh,
    required this.onRetry,
    required this.translate,
    this.profileAction,
  });

  final AgentsInspirationState state;
  final List<AgentsInspirationItem> items;
  final ValueChanged<AgentsInspirationChannel> onChannelChanged;
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
            title: translate('agents.inspiration.title'),
            actions: <Widget>[
              if (profileAction != null) profileAction!,
            ],
          ),
          _InspirationChannelSelector(
            channel: state.channel,
            onChanged: onChannelChanged,
            translate: translate,
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: onRefresh,
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (state.loading) {
      return _scrollableCentered(
        const CircularProgressIndicator(),
      );
    }
    if (state.unavailable) {
      return _scrollableCentered(
        SdkworkAgentsUnavailableState(
          headline: translate('agents.inspiration.unavailable.title'),
          hint: translate('agents.inspiration.unavailable.hint'),
          retryLabel: translate('agents.inspiration.retry'),
          onRetry: onRetry,
        ),
      );
    }
    if (state.errorMessage.isNotEmpty) {
      return _scrollableCentered(
        SdkworkAgentsEmptyState(
          headline: state.errorMessage,
          glyph: '✦',
          onRetry: onRetry,
          retryLabel: translate('agents.inspiration.retry'),
        ),
      );
    }
    if (items.isEmpty) {
      return _scrollableCentered(
        SdkworkAgentsEmptyState(
          headline: translate('agents.inspiration.empty'),
          glyph: '✦',
          onRetry: onRetry,
          retryLabel: translate('agents.inspiration.retry'),
        ),
      );
    }
    return GridView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingSm,
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingLg,
      ),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.74,
      ),
      itemCount: items.length,
      itemBuilder: (BuildContext context, int index) {
        return _InspirationCard(item: items[index], translate: translate);
      },
    );
  }

  /// Pull-to-refresh needs a scrollable even when there is nothing to scroll.
  Widget _scrollableCentered(Widget child) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: <Widget>[
        SizedBox(height: 420, child: Center(child: child)),
      ],
    );
  }
}

class _InspirationChannelSelector extends StatelessWidget {
  const _InspirationChannelSelector({
    required this.channel,
    required this.onChanged,
    required this.translate,
  });

  final AgentsInspirationChannel channel;
  final ValueChanged<AgentsInspirationChannel> onChanged;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingSm,
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingSm,
      ),
      child: SegmentedButton<AgentsInspirationChannel>(
        segments: <ButtonSegment<AgentsInspirationChannel>>[
          ButtonSegment<AgentsInspirationChannel>(
            value: AgentsInspirationChannel.discover,
            label: Text(translate('agents.inspiration.channel.discover')),
            icon: const Icon(Icons.explore_outlined, size: 18),
          ),
          ButtonSegment<AgentsInspirationChannel>(
            value: AgentsInspirationChannel.featured,
            label: Text(translate('agents.inspiration.channel.featured')),
            icon: const Icon(Icons.star_outline, size: 18),
          ),
        ],
        selected: <AgentsInspirationChannel>{channel},
        showSelectedIcon: false,
        onSelectionChanged: (Set<AgentsInspirationChannel> selection) {
          if (selection.isNotEmpty) {
            onChanged(selection.first);
          }
        },
      ),
    );
  }
}

class _InspirationCard extends StatelessWidget {
  const _InspirationCard({required this.item, required this.translate});

  final AgentsInspirationItem item;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    final author = item.author.isEmpty ? item.title : item.author;
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Semantics(
      container: true,
      label:
          '$author. ${item.title}. ${item.likes} ${translate('agents.inspiration.likes')}',
      child: Card(
        clipBehavior: Clip.antiAlias,
        margin: EdgeInsets.zero,
        color: scheme.surface,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: <Widget>[
                  if (item.hasCover)
                    Image.network(
                      item.coverUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (BuildContext context, Object error,
                              StackTrace? stack) =>
                          _CoverPlaceholder(
                        label: translate('agents.inspiration.coverUnavailable'),
                      ),
                    )
                  else
                    _CoverPlaceholder(
                      label: translate('agents.inspiration.coverUnavailable'),
                    ),
                  Positioned(
                    left: 8,
                    bottom: 8,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: Theme.of(context).dialogTheme.barrierColor ??
                            const Color(SdkworkAgentsFlutterTokens.colorScrim),
                        borderRadius: BorderRadius.circular(
                          SdkworkAgentsFlutterTokens.radiusMd,
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            const Icon(
                              Icons.favorite_border,
                              size: 12,
                              color: Color(
                                SdkworkAgentsFlutterTokens.colorPrimaryOn,
                              ),
                            ),
                            const SizedBox(width: 3),
                            Text(
                              '${item.likes}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(
                                  SdkworkAgentsFlutterTokens.colorPrimaryOn,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: scheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item.prompt,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      height: 1.3,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CoverPlaceholder extends StatelessWidget {
  const _CoverPlaceholder({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return ColoredBox(
      color: scheme.surfaceContainerHighest,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(
              Icons.image_outlined,
              size: 24,
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
      ),
    );
  }
}
