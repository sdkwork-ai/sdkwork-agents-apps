import 'package:sdkwork_agents_flutter_mobile_agents/sdkwork_agents_flutter_mobile_agents.dart';
import 'package:sdkwork_agents_flutter_mobile_assets/sdkwork_agents_flutter_mobile_assets.dart';
import 'package:sdkwork_agents_flutter_mobile_automation/sdkwork_agents_flutter_mobile_automation.dart';
import 'package:sdkwork_agents_flutter_mobile_canvas/sdkwork_agents_flutter_mobile_canvas.dart';
import 'package:sdkwork_agents_flutter_mobile_conversation/sdkwork_agents_flutter_mobile_conversation.dart';
import 'package:sdkwork_agents_flutter_mobile_creative/sdkwork_agents_flutter_mobile_creative.dart';
import 'package:sdkwork_agents_flutter_mobile_inspiration/sdkwork_agents_flutter_mobile_inspiration.dart';
import 'package:sdkwork_agents_flutter_mobile_library/sdkwork_agents_flutter_mobile_library.dart';
import 'package:sdkwork_agents_flutter_mobile_membership/sdkwork_agents_flutter_mobile_membership.dart';
import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';
import 'package:sdkwork_agents_flutter_mobile_projects/sdkwork_agents_flutter_mobile_projects.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Route assembly for the Agents Flutter mobile root.
///
/// Capability packages publish contributions; this root concatenates and
/// validates them. The shell package owns the tab order and the profile-link
/// set, so [assertAgentsMobileNavigationAligned] and
/// [assertSdkworkAgentsRouteRegistryMatchesTabs] are the two assertions that
/// keep the bottom bar, the registry, and the profile hub from drifting
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
    ...inspirationRouteContributions,
    ...creativeRouteContributions,
    ...assetsRouteContributions,
    ...canvasRouteContributions,
    ...agentsCatalogRouteContributions,
    ...membershipRouteContributions,
    ...profileRouteContributions,
    ...libraryRouteContributions,
    ...automationRouteContributions,
    ...projectsRouteContributions,
  ];
}

AgentsMobileRoutes createRoutes() {
  final contributions = createAgentsRouteContributions();
  assertAgentsMobileNavigationAligned(contributions);

  final registrations = createSdkworkAgentsRouteRegistry(contributions);
  assertSdkworkAgentsRouteRegistryMatchesTabs(registrations);

  return AgentsMobileRoutes(
    contributions: contributions,
    registrations: registrations,
    tabs: agentsMobileTabs,
  );
}
