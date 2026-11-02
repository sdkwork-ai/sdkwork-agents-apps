/// Bottom tab descriptors for the Agents Flutter mobile shell.
///
/// Authority: `specs/client-page-parity.spec.json` (`navigation.mobileBottomTabs`)
/// and `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7. The five slots are
/// the PC workbench's primary surfaces in the contract's order; the remaining
/// PC pages stay reachable from the profile hub ([agentsMobileProfileLinks]).
///
/// Tab labels are resolved through an injected translator so the shell package
/// stays free of locale resources; the composition root wires the copy in.
library;

import 'route_ids.dart';

/// Stable tab identifiers shared by every mobile root.
enum AgentsMobileTabId { tasks, inspiration, creative, assets, experts }

/// Glyph vocabulary shared with the PC/H5 icon set and the mini program
/// text-symbol projection.
abstract final class AgentsMobileTabGlyphs {
  static const String messageSquare = 'message-square';
  static const String sparkles = 'sparkles';
  static const String wand = 'wand';
  static const String image = 'image';
  static const String bot = 'bot';
  static const String infinity = 'infinity';
  static const String bookOpen = 'book-open';
  static const String timer = 'timer';
  static const String shareTwo = 'share-2';
}

class AgentsMobileTabDescriptor {
  const AgentsMobileTabDescriptor({
    required this.tab,
    required this.routeId,
    required this.routeName,
    required this.labelKey,
    required this.glyph,
  });

  final AgentsMobileTabId tab;

  /// Route identity behind this tab (section 7).
  final String routeId;

  /// Physical Flutter route name mounted at this slot.
  final String routeName;

  /// i18n key for the tab label.
  final String labelKey;

  /// Glyph name resolved by the shell renderer.
  final String glyph;
}

/// The five mobile tabs, in bottom-bar order.
///
/// This literal order is the navigation contract; `bootstrap/routes.dart`
/// asserts the route contributions match it index by index.
const List<AgentsMobileTabDescriptor> agentsMobileTabs =
    <AgentsMobileTabDescriptor>[
  AgentsMobileTabDescriptor(
    tab: AgentsMobileTabId.tasks,
    routeId: agentsConversationChatRouteId,
    routeName: agentsConversationRouteName,
    labelKey: 'agents.mobile.tab.tasks',
    glyph: AgentsMobileTabGlyphs.messageSquare,
  ),
  AgentsMobileTabDescriptor(
    tab: AgentsMobileTabId.inspiration,
    routeId: agentsInspirationDiscoverRouteId,
    routeName: agentsInspirationRouteName,
    labelKey: 'agents.mobile.tab.inspiration',
    glyph: AgentsMobileTabGlyphs.sparkles,
  ),
  AgentsMobileTabDescriptor(
    tab: AgentsMobileTabId.creative,
    routeId: agentsCreativeStudioRouteId,
    routeName: agentsCreativeRouteName,
    labelKey: 'agents.mobile.tab.creative',
    glyph: AgentsMobileTabGlyphs.wand,
  ),
  AgentsMobileTabDescriptor(
    tab: AgentsMobileTabId.assets,
    routeId: agentsAssetsListRouteId,
    routeName: agentsAssetsRouteName,
    labelKey: 'agents.mobile.tab.assets',
    glyph: AgentsMobileTabGlyphs.image,
  ),
  AgentsMobileTabDescriptor(
    tab: AgentsMobileTabId.experts,
    routeId: agentsCatalogListRouteId,
    routeName: agentsCatalogRouteName,
    labelKey: 'agents.mobile.tab.experts',
    glyph: AgentsMobileTabGlyphs.bot,
  ),
];

/// Route ids reachable from the profile hub, in contract order.
///
/// Authority: `specs/client-page-parity.spec.json`
/// (`navigation.mobileProfileLinks`). The profile package renders exactly this
/// list and the root asserts each id is a registered non-tab contribution.
const List<String> agentsMobileProfileLinks = <String>[
  agentsMembershipCatalogRouteId,
  agentsProjectsListRouteId,
  agentsLibraryListRouteId,
  agentsAutomationIndexRouteId,
  agentsConversationListRouteId,
  agentsSettingsIndexRouteId,
];

/// Resolves the tab that owns a route id, or `null` for nested surfaces.
AgentsMobileTabDescriptor? resolveAgentsMobileTabByRouteId(
  String routeId, {
  List<AgentsMobileTabDescriptor> tabs = agentsMobileTabs,
}) {
  for (final tab in tabs) {
    if (tab.routeId == routeId) {
      return tab;
    }
  }
  return null;
}

/// Bottom-bar index of a route id, or `-1` when the route is not a tab.
int resolveAgentsMobileTabIndex(
  String routeId, {
  List<AgentsMobileTabDescriptor> tabs = agentsMobileTabs,
}) {
  for (var index = 0; index < tabs.length; index += 1) {
    if (tabs[index].routeId == routeId) {
      return index;
    }
  }
  return -1;
}
