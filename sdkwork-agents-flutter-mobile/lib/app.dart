import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import 'app/app_routes.dart';
import 'app/theme_controller.dart';
import 'auth_gate.dart';
import 'bootstrap/runtime.dart';

class AgentsApp extends StatefulWidget {
  const AgentsApp({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  State<AgentsApp> createState() => _AgentsAppState();
}

class _AgentsAppState extends State<AgentsApp> {
  late final AgentsThemeController _themeController;

  @override
  void initState() {
    super.initState();
    _themeController = AgentsThemeController(
      store: widget.runtime.services.settingsStore,
      initialMode: widget.runtime.themeMode,
    );
  }

  @override
  void dispose() {
    _themeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final runtime = widget.runtime;
    return AgentsRuntimeScope(
      runtime: runtime,
      child: AgentsThemeScope(
        controller: _themeController,
        child: ListenableBuilder(
          listenable: _themeController,
          builder: (BuildContext context, Widget? child) {
            return MaterialApp(
              title: 'SDKWork Agents',
              debugShowCheckedModeBanner: false,
              theme: buildTechBlueTheme().copyWith(
                splashFactory: InkSparkle.splashFactory,
              ),
              darkTheme: buildTechBlueDarkTheme().copyWith(
                splashFactory: InkSparkle.splashFactory,
              ),
              themeMode: _themeController.mode,
              themeAnimationDuration: const Duration(milliseconds: 200),
              themeAnimationCurve: Curves.easeOutCubic,
              onGenerateRoute: (RouteSettings settings) =>
                  createAgentsAppRoute(settings, runtime),
              home: AuthGate(runtime: runtime),
            );
          },
        ),
      ),
    );
  }
}

class AgentsRuntimeScope extends InheritedWidget {
  const AgentsRuntimeScope({
    required this.runtime,
    required super.child,
    super.key,
  });

  final AgentsMobileRuntime runtime;

  static AgentsMobileRuntime of(BuildContext context) {
    final scope = context
        .dependOnInheritedWidgetOfExactType<AgentsRuntimeScope>();
    if (scope == null) {
      throw StateError('AgentsRuntimeScope is not available.');
    }
    return scope.runtime;
  }

  @override
  bool updateShouldNotify(AgentsRuntimeScope oldWidget) {
    return !identical(runtime, oldWidget.runtime);
  }
}
