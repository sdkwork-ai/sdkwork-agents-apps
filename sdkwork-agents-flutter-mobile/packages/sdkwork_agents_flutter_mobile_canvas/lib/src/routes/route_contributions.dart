import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Read-only canvas route contribution (`app.agents.canvas.board`).
const List<AgentsRouteContribution> canvasRouteContributions =
    <AgentsRouteContribution>[
  AgentsRouteContribution(
    id: agentsCanvasBoardRouteId,
    surface: 'app',
    domain: 'agents',
    capability: 'canvas',
    screen: 'board',
    titleKey: 'agents.mobile.tab.canvas',
    auth: 'required',
    permissionHint: 'ai.agents.read',
    flutter: const AgentsFlutterRoutePlacement(
      routeName: agentsCanvasRouteName,
    ),
  ),
];
