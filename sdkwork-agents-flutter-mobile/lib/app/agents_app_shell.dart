import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

import '../bootstrap/runtime.dart';
import 'tab_hosts.dart';

/// Bottom-navigation shell for the Agents Flutter mobile root.
///
/// Owns the selected tab and mounts the five capability hosts. The tab set comes
/// from the shell package (`agentsMobileTabs`) and was proven against the route
/// contributions during bootstrap, so the bar can never disagree with the route
/// registry.
class AgentsAppShell extends StatefulWidget {
  const AgentsAppShell({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  State<AgentsAppShell> createState() => _AgentsAppShellState();
}

class _AgentsAppShellState extends State<AgentsAppShell> {
  var _tabIndex = 0;

  @override
  Widget build(BuildContext context) {
    final runtime = widget.runtime;
    final translate = createSdkworkAgentsShellTranslator(runtime.localeTag);
    return SdkworkAgentsAppShellFrame(
      tabs: runtime.tabs,
      currentIndex: _tabIndex,
      onSelectTab: (int index) => setState(() => _tabIndex = index),
      translate: translate,
      destinations: <Widget>[
        AgentsConversationTab(runtime: runtime),
        AgentsCatalogTab(runtime: runtime),
        AgentsLibraryTab(runtime: runtime),
        AgentsAutomationTab(runtime: runtime),
        AgentsProjectsTab(runtime: runtime),
      ],
    );
  }
}
