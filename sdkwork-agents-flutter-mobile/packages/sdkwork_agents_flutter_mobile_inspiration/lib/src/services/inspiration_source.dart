/// Inspiration data port for the Agents Flutter mobile root.
///
/// The Flutter app SDK generated for this repository has no inspiration,
/// feeds, or skills target. The composition root therefore injects
/// [createUnsupportedAgentsInspirationSource], which throws
/// [SdkworkAgentsCapabilityUnavailableException] so the screen can render an
/// explicit localized unavailable state with retry. It must never fabricate a
/// feed.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/inspiration_models.dart';

abstract class AgentsInspirationSource {
  Future<AgentsInspirationFeed> loadFeed(
    AgentsInspirationChannel channel, {
    String? cursor,
  });
}

/// Source used while the Flutter root has no inspiration transport.
class UnsupportedAgentsInspirationSource implements AgentsInspirationSource {
  const UnsupportedAgentsInspirationSource();

  @override
  Future<AgentsInspirationFeed> loadFeed(
    AgentsInspirationChannel channel, {
    String? cursor,
  }) {
    throw const SdkworkAgentsCapabilityUnavailableException(
      'inspiration',
      detail:
          'No generated Flutter transport exists for the inspiration feeds.',
    );
  }
}

AgentsInspirationSource createUnsupportedAgentsInspirationSource() {
  return const UnsupportedAgentsInspirationSource();
}
