import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Inspiration route contribution.
///
/// 灵感 is the second bottom-bar slot in the mobile navigation contract
/// (`specs/client-page-parity.spec.json`).
const List<AgentsRouteContribution> inspirationRouteContributions =
    <AgentsRouteContribution>[
  AgentsRouteContribution(
    id: agentsInspirationDiscoverRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'inspiration',
    screen: 'discover',
    titleKey: 'agents.mobile.tab.inspiration',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsInspirationRouteName,
      tab: AgentsMobileTabId.inspiration,
      rootTab: true,
    ),
  ),
];
