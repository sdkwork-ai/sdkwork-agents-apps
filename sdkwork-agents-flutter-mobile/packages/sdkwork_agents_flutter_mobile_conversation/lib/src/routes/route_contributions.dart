import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Conversation route contributions.
///
/// Route ids and the tab placement are owned by the shell package so every
/// client root declares the same identity
/// (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7). The chat screen owns
/// the `tasks` bottom-bar slot; the session list is a nested screen.
const List<AgentsRouteContribution> conversationRouteContributions =
    <AgentsRouteContribution>[
  AgentsRouteContribution(
    id: agentsConversationChatRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'conversation',
    screen: 'chat',
    titleKey: 'agents.conversation.title',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsConversationRouteName,
      tab: AgentsMobileTabId.tasks,
      rootTab: true,
    ),
  ),
  AgentsRouteContribution(
    id: agentsConversationListRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'conversation',
    screen: 'list',
    titleKey: 'agents.conversation.sessions.title',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: AgentsFlutterRoutePlacement(
      routeName: agentsConversationHistoryRouteName,
    ),
  ),
];
