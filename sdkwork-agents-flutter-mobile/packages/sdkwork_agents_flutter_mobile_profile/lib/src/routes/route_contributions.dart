import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Profile hub and settings route contributions.
///
/// Both are stack screens: the profile hub is the mobile entry for the pages
/// that do not fit the five-slot bottom bar, and settings is its last link.
const List<AgentsRouteContribution> profileRouteContributions =
    <AgentsRouteContribution>[
  AgentsRouteContribution(
    id: agentsProfileIndexRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'profile',
    screen: 'index',
    titleKey: 'agents.mobile.tab.profile',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsProfileRouteName,
    ),
  ),
  AgentsRouteContribution(
    id: agentsSettingsIndexRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'settings',
    screen: 'index',
    titleKey: 'agents.mobile.tab.settings',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsSettingsRouteName,
    ),
  ),
];
