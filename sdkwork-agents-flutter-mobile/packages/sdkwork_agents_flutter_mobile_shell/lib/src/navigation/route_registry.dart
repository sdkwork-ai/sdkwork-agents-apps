/// Named-route registry assembly for the Flutter mobile shell.
///
/// Route ids follow `<surface>.<domain>.<capability>.<screen>` and stay
/// aligned with the PC, H5, mini program, and HarmonyOS roots. Physical Flutter
/// route names may differ while route ids stay stable.
library;

import 'mobile_tabs.dart';
import 'route_contributions.dart';

/// One mountable route, flattened from a capability contribution.
class SdkworkAgentsRouteRegistration {
  const SdkworkAgentsRouteRegistration({
    required this.id,
    required this.routeName,
    required this.titleKey,
    required this.authRequired,
    this.permissionHint,
    this.tab,
  });

  /// Route identity (`<surface>.<domain>.<capability>.<screen>`).
  final String id;

  /// Physical Flutter route name.
  final String routeName;

  /// i18n key for the screen title.
  final String titleKey;

  final bool authRequired;

  /// Permission the screen needs, when the surface is permission gated.
  final String? permissionHint;

  /// Bottom-bar slot, or `null` for a nested screen.
  final AgentsMobileTabId? tab;
}

/// Flattens contributions into the registry the root mounts.
List<SdkworkAgentsRouteRegistration> createSdkworkAgentsRouteRegistry(
  List<AgentsRouteContribution> contributions,
) {
  assertAgentsRouteContributionsAligned(contributions);
  return <SdkworkAgentsRouteRegistration>[
    for (final contribution in contributions)
      SdkworkAgentsRouteRegistration(
        id: contribution.id,
        routeName: contribution.routeName,
        titleKey: contribution.titleKey,
        authRequired: contribution.authRequired,
        permissionHint: contribution.permissionHint,
        tab: contribution.flutter.tab,
      ),
  ];
}

/// Route id behind a physical Flutter route name, or `null` when unmounted.
String? resolveSdkworkAgentsRouteId(
  String routeName,
  List<SdkworkAgentsRouteRegistration> routes,
) {
  for (final route in routes) {
    if (route.routeName == routeName) {
      return route.id;
    }
  }
  return null;
}
