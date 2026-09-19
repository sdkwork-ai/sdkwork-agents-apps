import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/projects_models.dart';
import '../state/projects_state.dart';

/// Route-level projects screen.
class AgentsProjectsScreen extends StatelessWidget {
  const AgentsProjectsScreen({
    super.key,
    required this.state,
    required this.projects,
    required this.onQueryChanged,
    required this.onRefresh,
    required this.translate,
    this.onOpen,
    this.trailingActions = const <Widget>[],
  });

  final AgentsProjectsState state;

  /// Rows to render; already filtered by the controller.
  final List<AgentsProjectSummary> projects;
  final ValueChanged<String> onQueryChanged;
  final Future<void> Function() onRefresh;
  final ValueChanged<AgentsProjectSummary>? onOpen;
  final String Function(String key) translate;
  final List<Widget> trailingActions;

  @override
  Widget build(BuildContext context) {
    final status = resolveSdkworkAgentsScreenStatus(
      projects.length,
      state.loading,
      state.errorMessage,
    );
    return SdkworkAgentsListTabScaffold(
      title: translate('agents.projects.title'),
      status: status,
      statusMessage: state.errorMessage.isNotEmpty
          ? state.errorMessage
          : translate('agents.projects.loading'),
      itemCount: projects.length,
      emptyHeadline: translate('agents.projects.empty'),
      emptyGlyph: '◈',
      searchHint: translate('agents.projects.search.placeholder'),
      onSearchChanged: onQueryChanged,
      banner: state.truncated ? translate('agents.projects.truncated') : null,
      onRefresh: onRefresh,
      onRetry: onRefresh,
      trailingActions: trailingActions,
      itemBuilder: (BuildContext context, int index) {
        final project = projects[index];
        final description = project.description;
        return ListTile(
          leading: const Icon(Icons.folder_outlined),
          title: Text(project.name, maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: description == null || description.isEmpty ? null : Text(description),
          onTap: onOpen == null ? null : () => onOpen!(project),
        );
      },
    );
  }
}
