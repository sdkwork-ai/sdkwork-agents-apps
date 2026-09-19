/// Canonical route identities for the Agents mobile surfaces.
///
/// Authority: `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7 — a route id
/// is `<surface>.<domain>.<capability>.<screen>`, and client roots align on
/// route identity rather than on identical physical paths. The literals below
/// are exactly the ones the PC, H5, and mini program roots declare; Flutter
/// route names are free to differ because each root owns its own navigation
/// stack.
///
/// The shell package owns this vocabulary so no capability package has to
/// depend on a sibling capability.
library;

// --- Route ids (aligned with PC, H5, mini program, and HarmonyOS) -----------

const String agentsConversationChatRouteId = 'app.agents.conversation.chat';
const String agentsConversationListRouteId = 'app.agents.conversation.list';
const String agentsCatalogListRouteId = 'app.agents.catalog.list';
const String agentsCatalogEditorRouteId = 'app.agents.catalog.editor';
const String agentsLibraryListRouteId = 'app.agents.library.list';
const String agentsAutomationIndexRouteId = 'app.agents.automation.index';
const String agentsProjectsListRouteId = 'app.agents.projects.list';

// --- Physical Flutter route names ------------------------------------------

const String agentsConversationRouteName = '/conversation';
const String agentsConversationHistoryRouteName = '/conversation/history';
const String agentsCatalogRouteName = '/agents';
const String agentsCatalogEditorRouteName = '/agents/editor';
const String agentsLibraryRouteName = '/library';
const String agentsAutomationRouteName = '/automation';
const String agentsProjectsRouteName = '/projects';

/// The four route-id segments a contribution must decompose into.
class AgentsRouteSegments {
  const AgentsRouteSegments({
    required this.surface,
    required this.domain,
    required this.capability,
    required this.screen,
  });

  final String surface;
  final String domain;
  final String capability;
  final String screen;

  /// `id == [surface, domain, capability, screen].join('.')`
  String get id => <String>[surface, domain, capability, screen].join('.');
}

/// Verifies that a contribution id decomposes into its own segment fields.
bool isAlignedAgentsRouteId(String id, AgentsRouteSegments segments) {
  return id == segments.id;
}
