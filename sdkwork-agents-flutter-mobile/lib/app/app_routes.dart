import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_agents/sdkwork_agents_flutter_mobile_agents.dart';
import 'package:sdkwork_agents_flutter_mobile_assets/sdkwork_agents_flutter_mobile_assets.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

import '../bootstrap/runtime.dart';
import 'stack_pages.dart';

/// Physical stack routes mounted by the root.
///
/// These are exactly the non-tab contributions in `bootstrap/routes.dart`; a
/// test asserts the two sets stay equal, so a registered route can never be
/// missing a screen builder.
const Set<String> agentsStackRouteNames = <String>{
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
};

/// Builds the named-route factory for the root [MaterialApp].
Route<dynamic>? createAgentsAppRoute(
  RouteSettings settings,
  AgentsMobileRuntime runtime,
) {
  final routeName = settings.name;
  if (routeName == null || routeName.isEmpty) {
    return null;
  }
  final Widget? screen = _buildAgentsStackScreen(
    routeName,
    runtime,
    settings.arguments,
  );
  if (screen == null) {
    return null;
  }
  return MaterialPageRoute<void>(
    settings: settings,
    builder: (BuildContext context) => screen,
  );
}

Widget? _buildAgentsStackScreen(
  String routeName,
  AgentsMobileRuntime runtime,
  Object? arguments,
) {
  switch (routeName) {
    case agentsProfileRouteName:
      return AgentsProfilePage(runtime: runtime);
    case agentsMembershipRouteName:
      return AgentsMembershipPage(runtime: runtime);
    case agentsProjectsRouteName:
      return AgentsProjectsPage(runtime: runtime);
    case agentsLibraryRouteName:
      return AgentsLibraryPage(runtime: runtime);
    case agentsAutomationRouteName:
      return AgentsAutomationPage(runtime: runtime);
    case agentsConversationHistoryRouteName:
      return AgentsConversationHistoryPage(runtime: runtime);
    case agentsSettingsRouteName:
      return AgentsSettingsPage(runtime: runtime);
    case agentsAssetsDetailRouteName:
      return AgentsAssetDetailPage(
        runtime: runtime,
        item: arguments is AgentsAssetItem ? arguments : null,
      );
    case agentsCanvasRouteName:
      return AgentsCanvasPage(runtime: runtime);
    case agentsCatalogEditorRouteName:
      return AgentsEditorPage(
        runtime: runtime,
        initialItem: arguments is AgentsCatalogItem ? arguments : null,
      );
    default:
      return null;
  }
}

/// Pushes one of the root's named stack routes.
Future<void> openAgentsStackRoute(
  BuildContext context,
  String routeName, {
  Object? arguments,
}) {
  return Navigator.of(context).pushNamed<void>(routeName, arguments: arguments);
}

/// Accessible avatar action every bottom tab exposes.
Widget buildAgentsProfileAction(
  BuildContext context,
  AgentsMobileRuntime runtime,
) {
  final translate = createSdkworkAgentsShellTranslator(runtime.localeTag);
  return SdkworkAgentsMobileAppBarAction(
    icon: Icons.person_outline,
    tooltip: translate('agents.mobile.shell.profile'),
    onPressed: () => openAgentsStackRoute(context, agentsProfileRouteName),
  );
}

/// Opens the read-only canvas projection from the creative studio.
Widget buildAgentsCanvasAction(
  BuildContext context,
  AgentsMobileRuntime runtime,
) {
  final translate = createSdkworkAgentsShellTranslator(runtime.localeTag);
  return SdkworkAgentsMobileAppBarAction(
    icon: Icons.grid_view,
    tooltip: translate('agents.mobile.tab.canvas'),
    onPressed: () => openAgentsStackRoute(context, agentsCanvasRouteName),
  );
}

/// Localized back tooltip for pushed pages.
String agentsBackTooltip(AgentsMobileRuntime runtime) {
  return createSdkworkAgentsShellTranslator(runtime.localeTag)(
    'agents.mobile.shell.back',
  );
}
