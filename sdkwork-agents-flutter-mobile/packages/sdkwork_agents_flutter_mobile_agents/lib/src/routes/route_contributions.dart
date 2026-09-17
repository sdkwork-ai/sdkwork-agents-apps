import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Route contributions for the agents capability.
///
/// Route ids follow `<surface>.<domain>.<capability>.<screen>` and stay
/// aligned with the PC, H5, mini program, and HarmonyOS roots. Route metadata
/// must not declare HTTP API paths, SDK methods, or transport details.
const List<SdkworkAgentsRouteRegistration> agentsRouteContributions =
    <SdkworkAgentsRouteRegistration>[
  SdkworkAgentsRouteRegistration(
    id: 'app.agents.catalog.list',
    routeName: '/agents',
    titleKey: 'agents.catalog.title',
    authRequired: true,
  ),
  SdkworkAgentsRouteRegistration(
    id: 'app.agents.conversation.chat',
    routeName: '/agents/:agentId/chat',
    titleKey: 'agents.catalog.title',
    authRequired: true,
  ),
];
