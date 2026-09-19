import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

import 'app/agents_app_shell.dart';
import 'auth_session.dart';
import 'bootstrap/runtime.dart';

/// Root auth gate.
///
/// Route guarding is a shell/runtime responsibility; capability packages declare
/// auth mode and permission hints only. The root has no sign-in flow yet, so an
/// unauthenticated launch explains how to supply a token instead of failing
/// silently.
class AuthGate extends StatelessWidget {
  const AuthGate({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    final decision = evaluateSdkworkAgentsAuthGate(
      authRequired: true,
      isAuthenticated: AgentsAuthSession.isAuthenticated,
    );
    if (decision.allowed) {
      return AgentsAppShell(runtime: runtime);
    }
    return const _UnauthenticatedView();
  }
}

class _UnauthenticatedView extends StatelessWidget {
  const _UnauthenticatedView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              const Text(
                'SDKWork Agents',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              const Text(
                'No access token is installed. Launch with '
                '--dart-define=SDKWORK_ACCESS_TOKEN=<token>, or call '
                'AgentsAuthSession.install() from the host bridge.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
