/// Route contribution contract for the Agents Flutter mobile root.
///
/// Authority: `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 5 and 7.
/// Capability packages publish contributions; the composition root assembles
/// them. A contribution declares route identity and placement only — never an
/// HTTP path, SDK method, or transport detail
/// (`FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` section 4).
library;

import 'mobile_tabs.dart';
import 'route_ids.dart';

/// Where a route is mounted in the Flutter root.
class AgentsFlutterRoutePlacement {
  const AgentsFlutterRoutePlacement({
    required this.routeName,
    this.tab,
    this.rootTab = false,
  });

  /// Physical Flutter route name, for example `/conversation`.
  final String routeName;

  /// Bottom-bar slot this route occupies, or `null` for a nested screen.
  final AgentsMobileTabId? tab;

  /// True when the route is a top-level tab entry.
  final bool rootTab;
}

class AgentsRouteContribution {
  const AgentsRouteContribution({
    required this.id,
    required this.surface,
    required this.domain,
    required this.capability,
    required this.screen,
    required this.titleKey,
    required this.auth,
    required this.flutter,
    this.permissionHint,
  });

  final String id;
  final String surface;
  final String domain;
  final String capability;
  final String screen;

  /// i18n key for the screen title.
  final String titleKey;

  /// `public` or `required`.
  final String auth;

  /// Permission the screen needs, when the surface is permission gated.
  final String? permissionHint;

  final AgentsFlutterRoutePlacement flutter;

  AgentsRouteSegments get segments => AgentsRouteSegments(
        surface: surface,
        domain: domain,
        capability: capability,
        screen: screen,
      );

  String get routeName => flutter.routeName;

  bool get authRequired => auth == 'required';
}

/// Validates a contribution list: every id must match its segments and no id
/// may be declared twice.
void assertAgentsRouteContributionsAligned(List<AgentsRouteContribution> contributions) {
  final seen = <String>{};
  final routeNames = <String, String>{};
  for (final contribution in contributions) {
    if (!isAlignedAgentsRouteId(contribution.id, contribution.segments)) {
      throw StateError('Route id is not aligned with its segments: ${contribution.id}');
    }
    if (!seen.add(contribution.id)) {
      throw StateError('Duplicate route id: ${contribution.id}');
    }
    final existing = routeNames[contribution.routeName];
    if (existing != null && existing != contribution.id) {
      throw StateError(
        'Route name ${contribution.routeName} is claimed by both $existing and '
        '${contribution.id}',
      );
    }
    routeNames[contribution.routeName] = contribution.id;
  }
}

/// Contributions that occupy a bottom-bar slot, in [agentsMobileTabs] order.
///
/// The root asserts this equals the tab set so a contribution can never drift
/// away from the shared mobile navigation contract.
List<AgentsRouteContribution> listAgentsTabContributions(
  List<AgentsRouteContribution> contributions,
) {
  final byRouteId = <String, AgentsRouteContribution>{
    for (final contribution in contributions) contribution.id: contribution,
  };
  final result = <AgentsRouteContribution>[];
  for (final tab in agentsMobileTabs) {
    final contribution = byRouteId[tab.routeId];
    if (contribution != null && contribution.flutter.rootTab) {
      result.add(contribution);
    }
  }
  return result;
}
