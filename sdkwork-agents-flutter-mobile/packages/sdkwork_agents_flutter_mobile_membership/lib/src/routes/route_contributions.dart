import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Membership catalog route contribution.
///
/// Reachable from the profile hub; it is not a bottom-bar tab in the mobile
/// navigation contract (`specs/client-page-parity.spec.json`).
const List<AgentsRouteContribution> membershipRouteContributions =
    <AgentsRouteContribution>[
  AgentsRouteContribution(
    id: agentsMembershipCatalogRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'membership',
    screen: 'catalog',
    titleKey: 'agents.mobile.tab.membership',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsMembershipRouteName,
    ),
  ),
];
