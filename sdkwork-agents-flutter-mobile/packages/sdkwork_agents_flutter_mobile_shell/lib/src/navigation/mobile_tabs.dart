/// Bottom tab descriptors for the Agents Flutter mobile shell.
///
/// The tab set and the route id behind each tab are identical to the H5 and
/// mini program roots; only the physical Flutter route name differs
/// (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 4 and 7).
///
/// Tab labels are resolved through an injected translator so the shell package
/// stays free of locale resources; the composition root wires the copy in.
library;

import 'route_ids.dart';

/// Stable tab identifiers shared by every mobile root.
enum AgentsMobileTabId { tasks, experts, library, automation, projects }

/// Glyph vocabulary shared with the PC/H5 icon set and the mini program
/// text-symbol projection.
abstract final class AgentsMobileTabGlyphs {
  static const String messageSquare = 'message-square';
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
const List<AgentsMobileTabDescriptor> agentsMobileTabs = <AgentsMobileTabDescriptor>[
  AgentsMobileTabDescriptor(
    tab: AgentsMobileTabId.tasks,
    routeId: agentsConversationChatRouteId,
    routeName: agentsConversationRouteName,
    labelKey: 'agents.mobile.tab.tasks',
    glyph: AgentsMobileTabGlyphs.messageSquare,
  ),
  AgentsMobileTabDescriptor(
    tab: AgentsMobileTabId.experts,
    routeId: agentsCatalogListRouteId,
    routeName: agentsCatalogRouteName,
    labelKey: 'agents.mobile.tab.experts',
    glyph: AgentsMobileTabGlyphs.infinity,
  ),
  AgentsMobileTabDescriptor(
    tab: AgentsMobileTabId.library,
    routeId: agentsLibraryListRouteId,
    routeName: agentsLibraryRouteName,
    labelKey: 'agents.mobile.tab.library',
    glyph: AgentsMobileTabGlyphs.bookOpen,
  ),
  AgentsMobileTabDescriptor(
    tab: AgentsMobileTabId.automation,
    routeId: agentsAutomationIndexRouteId,
    routeName: agentsAutomationRouteName,
    labelKey: 'agents.mobile.tab.automation',
    glyph: AgentsMobileTabGlyphs.timer,
  ),
  AgentsMobileTabDescriptor(
    tab: AgentsMobileTabId.projects,
    routeId: agentsProjectsListRouteId,
    routeName: agentsProjectsRouteName,
    labelKey: 'agents.mobile.tab.projects',
    glyph: AgentsMobileTabGlyphs.shareTwo,
  ),
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
