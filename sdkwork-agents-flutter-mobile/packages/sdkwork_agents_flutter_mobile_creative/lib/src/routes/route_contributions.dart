import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Creative studio route contribution.
///
/// 生成 is the third bottom-bar slot in the mobile navigation contract
/// (`specs/client-page-parity.spec.json`).
const List<AgentsRouteContribution> creativeRouteContributions =
    <AgentsRouteContribution>[
  AgentsRouteContribution(
    id: agentsCreativeStudioRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'creative',
    screen: 'studio',
    titleKey: 'agents.mobile.tab.creative',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsCreativeRouteName,
      tab: AgentsMobileTabId.creative,
      rootTab: true,
    ),
  ),
];
