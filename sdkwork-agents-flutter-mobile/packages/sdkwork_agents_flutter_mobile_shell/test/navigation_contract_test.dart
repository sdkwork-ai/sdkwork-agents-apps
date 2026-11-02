import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Contract guard for the Flutter mobile navigation model.
///
/// These assertions are the package-level proof that the five bottom tabs, the
/// route registry, and the profile hub cannot drift apart.

AgentsRouteContribution contribution({
  required String id,
  required String routeName,
  AgentsMobileTabId? tab,
  bool rootTab = false,
}) {
  final segments = id.split('.');
  return AgentsRouteContribution(
    id: id,
    surface: segments[0],
    domain: segments[1],
    capability: segments[2],
    screen: segments[3],
    titleKey: 'title.$id',
    auth: 'required',
    flutter: AgentsFlutterRoutePlacement(
      routeName: routeName,
      tab: tab,
      rootTab: rootTab,
    ),
  );
}

List<AgentsRouteContribution> fullContributions() {
  return <AgentsRouteContribution>[
    for (final tab in agentsMobileTabs)
      contribution(
        id: tab.routeId,
        routeName: tab.routeName,
        tab: tab.tab,
        rootTab: true,
      ),
    contribution(
      id: agentsMembershipCatalogRouteId,
      routeName: agentsMembershipRouteName,
    ),
    contribution(
      id: agentsProfileIndexRouteId,
      routeName: agentsProfileRouteName,
    ),
    contribution(
      id: agentsProjectsListRouteId,
      routeName: agentsProjectsRouteName,
    ),
    contribution(
      id: agentsLibraryListRouteId,
      routeName: agentsLibraryRouteName,
    ),
    contribution(
      id: agentsAutomationIndexRouteId,
      routeName: agentsAutomationRouteName,
    ),
    contribution(
      id: agentsConversationListRouteId,
      routeName: agentsConversationHistoryRouteName,
    ),
    contribution(
      id: agentsSettingsIndexRouteId,
      routeName: agentsSettingsRouteName,
    ),
  ];
}

void main() {
  test('the five bottom tabs are the contract order', () {
    expect(
      agentsMobileTabs
          .map((AgentsMobileTabDescriptor tab) => tab.routeId)
          .toList(),
      <String>[
        'app.agents.conversation.chat',
        'app.agents.inspiration.discover',
        'app.agents.creative.studio',
        'app.agents.assets.list',
        'app.agents.catalog.list',
      ],
    );
    expect(
      agentsMobileTabs
          .map((AgentsMobileTabDescriptor tab) => tab.labelKey)
          .toList(),
      <String>[
        'agents.mobile.tab.tasks',
        'agents.mobile.tab.inspiration',
        'agents.mobile.tab.creative',
        'agents.mobile.tab.assets',
        'agents.mobile.tab.experts',
      ],
    );
  });

  test('the profile hub links match the contract order', () {
    expect(agentsMobileProfileLinks, <String>[
      'app.agents.membership.catalog',
      'app.agents.projects.list',
      'app.agents.library.list',
      'app.agents.automation.index',
      'app.agents.conversation.list',
      'app.agents.settings.index',
    ]);
  });

  test('a complete contribution set is aligned', () {
    expect(
      () => assertAgentsMobileNavigationAligned(fullContributions()),
      returnsNormally,
    );
    final tabs = listAgentsTabContributions(fullContributions());
    expect(tabs.length, agentsMobileTabs.length);
    for (var index = 0; index < tabs.length; index += 1) {
      expect(tabs[index].id, agentsMobileTabs[index].routeId);
      expect(tabs[index].routeName, agentsMobileTabs[index].routeName);
    }
  });

  test('a missing tab contribution fails instead of rendering a short bar', () {
    final contributions = fullContributions()
        .where((AgentsRouteContribution item) =>
            item.id != agentsAssetsListRouteId)
        .toList();
    expect(
      () => assertAgentsMobileNavigationAligned(contributions),
      throwsA(isA<StateError>()),
    );
  });

  test('an extra root tab fails the navigation contract', () {
    final contributions = fullContributions()
      ..add(
        contribution(
          id: 'app.agents.canvas.board',
          routeName: '/canvas',
          tab: AgentsMobileTabId.tasks,
          rootTab: true,
        ),
      );
    expect(
      () => assertAgentsMobileNavigationAligned(contributions),
      throwsA(isA<StateError>()),
    );
  });

  test('a missing profile link fails the navigation contract', () {
    final contributions = fullContributions()
        .where((AgentsRouteContribution item) =>
            item.id != agentsSettingsIndexRouteId)
        .toList();
    expect(
      () => assertAgentsMobileNavigationAligned(contributions),
      throwsA(isA<StateError>()),
    );
  });

  test('the flattened registry matches the tab declarations', () {
    final registry = createSdkworkAgentsRouteRegistry(fullContributions());
    expect(() => assertSdkworkAgentsRouteRegistryMatchesTabs(registry),
        returnsNormally);
    expect(
        registry
            .where((SdkworkAgentsRouteRegistration route) => route.tab != null)
            .length,
        5);
  });

  test('the registry rejects a misordered tab', () {
    final registry = createSdkworkAgentsRouteRegistry(fullContributions());
    final reordered = <SdkworkAgentsRouteRegistration>[
      registry[1],
      registry[0],
      ...registry.skip(2),
    ];
    expect(
      () => assertSdkworkAgentsRouteRegistryMatchesTabs(reordered),
      throwsA(isA<StateError>()),
    );
  });
}
