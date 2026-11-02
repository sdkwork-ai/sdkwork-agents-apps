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
void assertAgentsRouteContributionsAligned(
    List<AgentsRouteContribution> contributions) {
  final seen = <String>{};
  final routeNames = <String, String>{};
  for (final contribution in contributions) {
    if (!isAlignedAgentsRouteId(contribution.id, contribution.segments)) {
      throw StateError(
          'Route id is not aligned with its segments: ${contribution.id}');
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

/// Proves the contribution set is exactly the shared mobile navigation contract.
///
/// This is the single assertion that keeps the bottom bar, the route registry,
/// and the profile hub from drifting apart: the five contract tab ids must be
/// present, flagged as root tabs, and ordered exactly like [agentsMobileTabs],
/// and every [agentsMobileProfileLinks] id must be registered as a non-tab
/// screen.
void assertAgentsMobileNavigationAligned(
    List<AgentsRouteContribution> contributions) {
  assertAgentsRouteContributionsAligned(contributions);
  final byRouteId = <String, AgentsRouteContribution>{
    for (final contribution in contributions) contribution.id: contribution,
  };

  for (var index = 0; index < agentsMobileTabs.length; index += 1) {
    final declaration = agentsMobileTabs[index];
    final contribution = byRouteId[declaration.routeId];
    if (contribution == null) {
      throw StateError(
        'Tab $index (${declaration.routeId}) has no route contribution.',
      );
    }
    if (!contribution.flutter.rootTab) {
      throw StateError(
        '${declaration.routeId} is declared in the bottom bar but its '
        'contribution is not a root tab.',
      );
    }
    if (contribution.flutter.tab != declaration.tab) {
      throw StateError(
        '${declaration.routeId} declares tab ${contribution.flutter.tab} but '
        'the bottom bar expects ${declaration.tab}.',
      );
    }
    if (contribution.routeName != declaration.routeName) {
      throw StateError(
        '${declaration.routeId} is mounted at ${contribution.routeName} but the '
        'bottom bar expects ${declaration.routeName}.',
      );
    }
  }

  final extraTabs = contributions
      .where((AgentsRouteContribution contribution) =>
          contribution.flutter.rootTab &&
          resolveAgentsMobileTabByRouteId(contribution.id) == null)
      .map((AgentsRouteContribution contribution) => contribution.id)
      .toList(growable: false);
  if (extraTabs.isNotEmpty) {
    throw StateError(
      'Route contributions claim a bottom-bar slot the contract does not '
      'declare: ${extraTabs.join(', ')}',
    );
  }

  for (final routeId in agentsMobileProfileLinks) {
    final contribution = byRouteId[routeId];
    if (contribution == null) {
      throw StateError('Profile link $routeId has no route contribution.');
    }
    if (contribution.flutter.rootTab) {
      throw StateError(
        'Profile link $routeId must be a stack screen, not a bottom-bar tab.',
      );
    }
  }
}

/// Contributions that occupy a bottom-bar slot, in [agentsMobileTabs] order.
///
/// Throws when a slot has no contribution instead of silently rendering a
/// shorter bar, so a missing screen can never pass as a valid shell.
List<AgentsRouteContribution> listAgentsTabContributions(
  List<AgentsRouteContribution> contributions,
) {
  final byRouteId = <String, AgentsRouteContribution>{
    for (final contribution in contributions) contribution.id: contribution,
  };
  final result = <AgentsRouteContribution>[];
  for (final tab in agentsMobileTabs) {
    final contribution = byRouteId[tab.routeId];
    if (contribution == null || !contribution.flutter.rootTab) {
      throw StateError(
          'No root-tab contribution is registered for ${tab.routeId}.');
    }
    result.add(contribution);
  }
  return result;
}
