import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/agents_messages.dart';
import '../models/agent_models.dart';
import '../state/agent_catalog_state.dart';

/// Route-level capability screen. Root shell mounts this; business UI lives in
/// capability packages.
class AgentsCatalogScreen extends StatelessWidget {
  const AgentsCatalogScreen({super.key, required this.state});

  final AgentsCatalogState state;

  @override
  Widget build(BuildContext context) {
    final status = resolveSdkworkAgentsScreenStatus(
      state.items.length,
      state.loading,
      state.errorMessage,
    );
    if (status != SdkworkAgentsScreenStatus.ready) {
      return Scaffold(
        appBar: AppBar(title: const Text('Agents')),
        body: SdkworkAgentsStatusView(
          message: switch (status) {
            SdkworkAgentsScreenStatus.loading =>
              agentsMessagesEnUs['agents.catalog.loading']!,
            SdkworkAgentsScreenStatus.empty =>
              agentsMessagesEnUs['agents.catalog.empty']!,
            SdkworkAgentsScreenStatus.error =>
              agentsMessagesEnUs['agents.catalog.loadFailed']!,
            SdkworkAgentsScreenStatus.ready => '',
          },
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Agents')),
      body: ListView.builder(
        itemCount: state.items.length,
        itemBuilder: (context, index) {
          final AgentsCatalogItem item = state.items[index];
          return ListTile(
            title: Text(item.name),
            subtitle: item.description.isEmpty ? null : Text(item.description),
          );
        },
      ),
    );
  }
}
