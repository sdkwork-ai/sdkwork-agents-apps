/// Profile identity adapter for the Agents Flutter mobile root.
///
/// The generated Flutter app SDK has no IAM user-profile operation, so the hub
/// summarizes the authenticated application session instead. When the access
/// token is a JWT, the display name is read from its unverified claims; the
/// token is never sent anywhere and no claim is trusted for authorization.
/// Without a usable name the screen falls back to localized "signed-in" copy.
library;

import 'dart:convert';

import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';

AgentsProfileIdentitySource createAgentsSessionProfileIdentitySource({
  required String? Function() accessToken,
  required String localeTag,
}) {
  return _AgentsSessionProfileIdentitySource(
    accessToken: accessToken,
    localeTag: localeTag,
  );
}

class _AgentsSessionProfileIdentitySource
    implements AgentsProfileIdentitySource {
  const _AgentsSessionProfileIdentitySource({
    required this.accessToken,
    required this.localeTag,
  });

  final String? Function() accessToken;
  final String localeTag;

  @override
  Future<AgentsProfileIdentity> load() async {
    final token = accessToken();
    final authenticated = token != null && token.isNotEmpty;
    return AgentsProfileIdentity(
      isAuthenticated: authenticated,
      displayName: authenticated ? readAgentsSessionDisplayName(token) : null,
      accountLabel: 'SDKWork Agents',
      localeTag: localeTag,
    );
  }
}

/// Reads a human display name from an unverified JWT payload.
///
/// Returns null for opaque tokens and for tokens without a name-like claim, in
/// which case the caller falls back to localized session copy.
String? readAgentsSessionDisplayName(String token) {
  final parts = token.split('.');
  if (parts.length != 3) {
    return null;
  }
  try {
    final payload = utf8.decode(
      base64Url.decode(base64Url.normalize(parts[1])),
    );
    final decoded = jsonDecode(payload);
    if (decoded is! Map) {
      return null;
    }
    for (final claim in const <String>[
      'name',
      'preferred_username',
      'nickname',
    ]) {
      final value = decoded[claim];
      if (value is String && value.trim().isNotEmpty) {
        return value.trim();
      }
    }
  } on FormatException {
    return null;
  }
  return null;
}
