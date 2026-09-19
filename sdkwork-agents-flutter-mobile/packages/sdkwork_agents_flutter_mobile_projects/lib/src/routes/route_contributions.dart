import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Projects route contributions.
const List<AgentsRouteContribution> projectsRouteContributions =
    <AgentsRouteContribution>[
  AgentsRouteContribution(
    id: agentsProjectsListRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'projects',
    screen: 'list',
    titleKey: 'agents.projects.title',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsProjectsRouteName,
      tab: AgentsMobileTabId.projects,
      rootTab: true,
    ),
  ),
];
