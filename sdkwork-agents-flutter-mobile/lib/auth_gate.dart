import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

import 'app/agents_app_shell.dart';
import 'auth_session.dart';
import 'bootstrap/runtime.dart';

/// Root auth gate.
///
/// Route guarding is a shell/runtime responsibility; capability packages declare
/// auth mode and permission hints only. The root has no sign-in flow yet, so an
/// unauthenticated launch explains how to supply a token instead of failing
/// silently. The explanation is localized through the shared shell catalog.
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
    return _UnauthenticatedView(
      translate: createSdkworkAgentsShellTranslator(runtime.localeTag),
    );
  }
}

class _UnauthenticatedView extends StatelessWidget {
  const _UnauthenticatedView({required this.translate});

  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                Text(
                  translate('agents.auth.title'),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  translate('agents.auth.tokenRequired'),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
