import 'package:sdkwork_agents_flutter_mobile_agents/sdkwork_agents_flutter_mobile_agents.dart';
import 'package:sdkwork_agents_flutter_mobile_automation/sdkwork_agents_flutter_mobile_automation.dart';
import 'package:sdkwork_agents_flutter_mobile_conversation/sdkwork_agents_flutter_mobile_conversation.dart';
import 'package:sdkwork_agents_flutter_mobile_library/sdkwork_agents_flutter_mobile_library.dart';
import 'package:sdkwork_agents_flutter_mobile_projects/sdkwork_agents_flutter_mobile_projects.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Route assembly for the Agents Flutter mobile root.
///
/// Capability packages publish contributions; this root concatenates and
/// validates them, then proves the tab set in [agentsMobileTabs] is exactly the
/// set of tab contributions. That assertion is what keeps the bottom bar from
/// drifting away from the shared mobile navigation contract
/// (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 5 and 7).
class AgentsMobileRoutes {
  const AgentsMobileRoutes({
    required this.contributions,
    required this.registrations,
    required this.tabs,
  });

  final List<AgentsRouteContribution> contributions;
  final List<SdkworkAgentsRouteRegistration> registrations;
  final List<AgentsMobileTabDescriptor> tabs;
}

List<AgentsRouteContribution> createAgentsRouteContributions() {
  return <AgentsRouteContribution>[
    ...conversationRouteContributions,
    ...agentsCatalogRouteContributions,
    ...libraryRouteContributions,
    ...automationRouteContributions,
    ...projectsRouteContributions,
  ];
}

AgentsMobileRoutes createRoutes() {
  final contributions = createAgentsRouteContributions();
  assertAgentsRouteContributionsAligned(contributions);

  final tabs = listAgentsTabContributions(contributions);
  if (tabs.length != agentsMobileTabs.length) {
    throw StateError(
      'Expected ${agentsMobileTabs.length} tab contributions but found '
      '${tabs.length}: the bottom bar would render fewer tabs than the shared '
      'mobile contract declares.',
    );
  }
  for (var index = 0; index < agentsMobileTabs.length; index += 1) {
    final declaration = agentsMobileTabs[index];
    final contribution = tabs[index];
    if (contribution.id != declaration.routeId ||
        contribution.routeName != declaration.routeName) {
      throw StateError(
        'Tab $index is out of order: shell declares '
        '${declaration.routeId} at ${declaration.routeName} but contributions '
        'provide ${contribution.id} at ${contribution.routeName}.',
      );
    }
  }

  return AgentsMobileRoutes(
    contributions: contributions,
    registrations: createSdkworkAgentsRouteRegistry(contributions),
    tabs: agentsMobileTabs,
  );
}
