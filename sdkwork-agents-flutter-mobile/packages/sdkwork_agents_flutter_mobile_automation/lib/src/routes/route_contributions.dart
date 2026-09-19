import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Automation route contributions.
const List<AgentsRouteContribution> automationRouteContributions =
    <AgentsRouteContribution>[
  AgentsRouteContribution(
    id: agentsAutomationIndexRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'automation',
    screen: 'index',
    titleKey: 'agents.automation.title',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsAutomationRouteName,
      tab: AgentsMobileTabId.automation,
      rootTab: true,
    ),
  ),
];
