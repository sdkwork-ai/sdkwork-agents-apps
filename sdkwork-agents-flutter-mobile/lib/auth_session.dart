/// Access-token holder for the Agents Flutter mobile root.
///
/// The root has no sign-in flow yet, so the token comes from the build
/// environment (`--dart-define=SDKWORK_ACCESS_TOKEN=...`) or from a caller that
/// completes an external sign-in and calls [install]. Keeping the holder at the
/// root is what lets `createSdkClients()` stay declarative
/// (`FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` — the root owns credential
/// wiring).
library;

const String agentsConfiguredAccessToken = String.fromEnvironment('SDKWORK_ACCESS_TOKEN');

class AgentsAuthSession {
  const AgentsAuthSession._();

  static String? _accessToken =
      agentsConfiguredAccessToken.isEmpty ? null : agentsConfiguredAccessToken;

  static String? get accessToken => _accessToken;

  static bool get isAuthenticated => _accessToken != null && _accessToken!.isNotEmpty;

  /// Installs a token obtained out of band (host bridge, deep link, test).
  static void install(String accessToken) {
    final normalized = accessToken.trim();
    _accessToken = normalized.isEmpty ? null : normalized;
  }

  static void clear() {
    _accessToken = null;
  }
}
