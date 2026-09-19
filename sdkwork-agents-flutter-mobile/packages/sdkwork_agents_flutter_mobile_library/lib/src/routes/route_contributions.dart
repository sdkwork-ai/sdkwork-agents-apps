import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Library route contributions.
///
/// Route ids and the tab placement are owned by the shell package so every
/// client root declares the same identity
/// (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
const List<AgentsRouteContribution> libraryRouteContributions =
    <AgentsRouteContribution>[
  AgentsRouteContribution(
    id: agentsLibraryListRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'library',
    screen: 'list',
    titleKey: 'agents.library.title',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsLibraryRouteName,
      tab: AgentsMobileTabId.library,
      rootTab: true,
    ),
  ),
];
