import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/agent_models.dart';
import '../state/agent_catalog_state.dart';

/// Route-level capability screen for the experts tab.
///
/// Root shell mounts this; business UI lives in capability packages. The scope
/// selector mirrors the H5 and mini program "my agents / market" split, and its
/// labels come from the shared shell copy so every root says the same thing.
class AgentsCatalogScreen extends StatelessWidget {
  const AgentsCatalogScreen({
    super.key,
    required this.state,
    required this.onScopeChanged,
    required this.onQueryChanged,
    required this.onRefresh,
    required this.translate,
    this.onLoadMore,
    this.onOpenAgent,
    this.trailingActions = const <Widget>[],
  });

  final AgentsCatalogState state;
  final ValueChanged<AgentsCatalogScope> onScopeChanged;
  final ValueChanged<String> onQueryChanged;
  final Future<void> Function() onRefresh;
  final VoidCallback? onLoadMore;
  final ValueChanged<AgentsCatalogItem>? onOpenAgent;
  final String Function(String key) translate;
  final List<Widget> trailingActions;

  @override
  Widget build(BuildContext context) {
    final status = resolveSdkworkAgentsScreenStatus(
      state.items.length,
      state.loading,
      state.errorMessage,
    );
    // The "load more" affordance is a trailing list row rather than a banner,
    // so it never appears above the results it belongs to.
    final hasFooter = state.hasMore && onLoadMore != null;
    return SdkworkAgentsListTabScaffold(
      title: translate('agents.catalog.title'),
      status: status,
      statusMessage: state.errorMessage.isNotEmpty
          ? state.errorMessage
          : translate('agents.catalog.loading'),
      itemCount: state.items.length + (hasFooter ? 1 : 0),
      emptyHeadline: translate('agents.catalog.empty'),
      emptyGlyph: '∞',
      header: AgentsCatalogScopeSelector(
        scope: state.scope,
        onChanged: onScopeChanged,
        translate: translate,
      ),
      searchHint: translate('agents.catalog.search.placeholder'),
      onSearchChanged: onQueryChanged,
      onRefresh: onRefresh,
      onRetry: onRefresh,
      trailingActions: trailingActions,
      itemBuilder: (BuildContext context, int index) {
        if (index >= state.items.length) {
          return Center(
            child: TextButton(
              onPressed: onLoadMore,
              child: Text(translate('agents.catalog.loadMore')),
            ),
          );
        }
        final item = state.items[index];
        return ListTile(
          leading: const Icon(Icons.smart_toy_outlined),
          title: Text(item.name, maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: item.description.isEmpty ? null : Text(item.description),
          onTap: onOpenAgent == null ? null : () => onOpenAgent!(item),
        );
      },
    );
  }
}

/// "My agents / Market" scope selector used above the catalog list.
class AgentsCatalogScopeSelector extends StatelessWidget {
  const AgentsCatalogScopeSelector({
    super.key,
    required this.scope,
    required this.onChanged,
    required this.translate,
  });

  final AgentsCatalogScope scope;
  final ValueChanged<AgentsCatalogScope> onChanged;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SegmentedButton<AgentsCatalogScope>(
        segments: <ButtonSegment<AgentsCatalogScope>>[
          ButtonSegment<AgentsCatalogScope>(
            value: AgentsCatalogScope.mine,
            label: Text(translate('agents.mobile.tab.myAgents')),
          ),
          ButtonSegment<AgentsCatalogScope>(
            value: AgentsCatalogScope.market,
            label: Text(translate('agents.mobile.tab.market')),
          ),
        ],
        selected: <AgentsCatalogScope>{scope},
        onSelectionChanged: (Set<AgentsCatalogScope> selection) {
          if (selection.isNotEmpty) {
            onChanged(selection.first);
          }
        },
      ),
    );
  }
}
