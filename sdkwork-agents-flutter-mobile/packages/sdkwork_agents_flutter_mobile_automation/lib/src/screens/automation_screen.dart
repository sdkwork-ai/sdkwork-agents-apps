import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/automation_models.dart';
import '../state/automation_state.dart';

/// Route-level automation screen.
class AgentsAutomationScreen extends StatelessWidget {
  const AgentsAutomationScreen({
    super.key,
    required this.state,
    required this.tasks,
    required this.onQueryChanged,
    required this.onRefresh,
    required this.statusLabel,
    required this.translate,
    this.trailingActions = const <Widget>[],
  });

  final AgentsAutomationState state;

  /// Rows to render; already filtered by the controller.
  final List<AgentsTaskSummary> tasks;
  final ValueChanged<String> onQueryChanged;
  final Future<void> Function() onRefresh;

  /// Localizes a raw server status.
  final String Function(String? status) statusLabel;
  final String Function(String key) translate;
  final List<Widget> trailingActions;

  @override
  Widget build(BuildContext context) {
    final status = resolveSdkworkAgentsScreenStatus(
      tasks.length,
      state.loading,
      state.errorMessage,
    );
    return SdkworkAgentsListTabScaffold(
      title: translate('agents.automation.title'),
      status: status,
      statusMessage: state.errorMessage.isNotEmpty
          ? state.errorMessage
          : translate('agents.automation.loading'),
      itemCount: tasks.length,
      emptyHeadline: translate('agents.automation.empty'),
      emptyGlyph: '◷',
      searchHint: translate('agents.automation.search.placeholder'),
      onSearchChanged: onQueryChanged,
      banner: state.truncated ? translate('agents.automation.truncated') : null,
      onRefresh: onRefresh,
      onRetry: onRefresh,
      trailingActions: trailingActions,
      itemBuilder: (BuildContext context, int index) {
        final task = tasks[index];
        final schedule = task.schedule;
        final label = statusLabel(task.status);
        return ListTile(
          leading: const Icon(Icons.schedule_outlined),
          title: Text(task.name, maxLines: 2, overflow: TextOverflow.ellipsis),
          subtitle: Text(
            <String>[
              if (label.isNotEmpty) label,
              if (schedule != null && schedule.isNotEmpty) schedule,
            ].join(' · '),
          ),
        );
      },
    );
  }
}
