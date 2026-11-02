import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Asset library and detail route contributions.
///
/// 资产 is the fourth bottom-bar slot in the mobile navigation contract
/// (`specs/client-page-parity.spec.json`). The detail surface is a first-class
/// stack route so a deep link and a library tap resolve the same page.
const List<AgentsRouteContribution> assetsRouteContributions =
    <AgentsRouteContribution>[
  AgentsRouteContribution(
    id: agentsAssetsListRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'assets',
    screen: 'list',
    titleKey: 'agents.mobile.tab.assets',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsAssetsRouteName,
      tab: AgentsMobileTabId.assets,
      rootTab: true,
    ),
  ),
  AgentsRouteContribution(
    id: agentsAssetsDetailRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'assets',
    screen: 'detail',
    titleKey: 'agents.mobile.assets.detailTitle',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: const AgentsFlutterRoutePlacement(
      routeName: agentsAssetsDetailRouteName,
    ),
  ),
];
