import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Route contributions for the agents capability.
///
/// Route ids follow `<surface>.<domain>.<capability>.<screen>` and stay
/// aligned with the PC, H5, mini program, and HarmonyOS roots. Route metadata
/// must not declare HTTP API paths, SDK methods, or transport details.
const List<AgentsRouteContribution> agentsCatalogRouteContributions =
    <AgentsRouteContribution>[
  AgentsRouteContribution(
    id: agentsCatalogListRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'catalog',
    screen: 'list',
    titleKey: 'agents.catalog.title',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsCatalogRouteName,
      tab: AgentsMobileTabId.experts,
      rootTab: true,
    ),
  ),
  AgentsRouteContribution(
    id: agentsCatalogEditorRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'catalog',
    screen: 'editor',
    titleKey: 'agents.catalog.title',
    auth: 'required',
    permissionHint: 'ai.agents.manage',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsCatalogEditorRouteName,
    ),
  ),
];
