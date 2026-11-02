import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_agents_flutter_mobile/app/app_routes.dart';
import 'package:sdkwork_agents_flutter_mobile/bootstrap/routes.dart';
import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Root-level navigation contract: the five-tab bar, the registered route ids,
/// and the stack screens behind the profile hub.
void main() {
  test('root tabs match the mobile navigation contract exactly', () {
    final routes = createRoutes();
    expect(
      routes.tabs.map((AgentsMobileTabDescriptor tab) => tab.routeId).toList(),
      <String>[
        agentsConversationChatRouteId,
        agentsInspirationDiscoverRouteId,
        agentsCreativeStudioRouteId,
        agentsAssetsListRouteId,
        agentsCatalogListRouteId,
      ],
    );
    expect(
      routes.tabs.map((AgentsMobileTabDescriptor tab) => tab.labelKey).toList(),
      <String>[
        'agents.mobile.tab.tasks',
        'agents.mobile.tab.inspiration',
        'agents.mobile.tab.creative',
        'agents.mobile.tab.assets',
        'agents.mobile.tab.experts',
      ],
    );
  });

  test('every M1 route id is registered exactly once', () {
    final routes = createRoutes();
    final ids = routes.registrations
        .map((SdkworkAgentsRouteRegistration route) => route.id)
        .toList();
    const required = <String>[
      agentsConversationChatRouteId,
      agentsCatalogListRouteId,
      agentsInspirationDiscoverRouteId,
      agentsCreativeStudioRouteId,
      agentsAssetsListRouteId,
      agentsMembershipCatalogRouteId,
      agentsProfileIndexRouteId,
    ];
    for (final id in required) {
      expect(ids.where((String value) => value == id).length, 1, reason: id);
    }
    expect(ids.toSet().length, ids.length, reason: 'no duplicate route ids');
  });

  test('profile links are registered as non-tab stack routes', () {
    final routes = createRoutes();
    final byId = <String, SdkworkAgentsRouteRegistration>{
      for (final registration in routes.registrations)
        registration.id: registration,
    };
    expect(
      agentsProfileLinks.map((AgentsProfileLink link) => link.routeId).toList(),
      agentsMobileProfileLinks,
    );
    for (final link in agentsProfileLinks) {
      final registration = byId[link.routeId];
      expect(registration, isNotNull, reason: link.routeId);
      expect(registration!.tab, isNull, reason: link.routeId);
      expect(registration.routeName, link.routeName);
    }
  });

  test('the stack route factory covers every non-tab registration', () {
    final routes = createRoutes();
    final stackNames = routes.registrations
        .where((SdkworkAgentsRouteRegistration route) => route.tab == null)
        .map((SdkworkAgentsRouteRegistration route) => route.routeName)
        .toSet();
    expect(stackNames, agentsStackRouteNames);
    expect(stackNames, <String>{
      agentsProfileRouteName,
      agentsMembershipRouteName,
      agentsProjectsRouteName,
      agentsLibraryRouteName,
      agentsAutomationRouteName,
      agentsConversationHistoryRouteName,
      agentsSettingsRouteName,
      agentsAssetsDetailRouteName,
      agentsCanvasRouteName,
      agentsCatalogEditorRouteName,
    });
  });

  test('the old secondary tabs are no longer in the bottom bar', () {
    final tabIds = createRoutes().tabs
        .map((AgentsMobileTabDescriptor tab) => tab.routeId)
        .toSet();
    expect(tabIds.contains(agentsLibraryListRouteId), isFalse);
    expect(tabIds.contains(agentsAutomationIndexRouteId), isFalse);
    expect(tabIds.contains(agentsProjectsListRouteId), isFalse);
  });
}
