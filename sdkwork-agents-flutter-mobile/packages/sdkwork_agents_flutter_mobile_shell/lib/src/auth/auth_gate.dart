/// AuthGate integration for the Flutter mobile shell.
///
/// Route guards are shell/runtime responsibilities. Capability packages declare
/// auth mode and permission hints only.
class SdkworkAgentsAuthGateDecision {
  const SdkworkAgentsAuthGateDecision({required this.allowed, this.reason});

  final bool allowed;
  final String? reason;
}

SdkworkAgentsAuthGateDecision evaluateSdkworkAgentsAuthGate({
  required bool authRequired,
  required bool isAuthenticated,
}) {
  if (!authRequired || isAuthenticated) {
    return const SdkworkAgentsAuthGateDecision(allowed: true);
  }
  return const SdkworkAgentsAuthGateDecision(
    allowed: false,
    reason: 'authentication-required',
  );
}
