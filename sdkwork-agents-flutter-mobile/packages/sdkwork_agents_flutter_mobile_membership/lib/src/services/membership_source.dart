/// Membership data port for the Agents Flutter mobile root.
///
/// The Flutter app SDK generated for this repository has no membership or
/// checkout transport. The composition root injects
/// [createUnsupportedAgentsMembershipSource], which reports the capability as
/// unavailable so the catalog renders an explicit localized state with retry.
/// It never fabricates plans, prices, or a member summary.
library;

import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/membership_models.dart';

abstract class AgentsMembershipSource {
  Future<AgentsMembershipOverview> loadOverview();

  /// Returns the checkout URL the platform entry opens.
  Future<String> createCheckoutUrl(String planId);
}

/// Source used while the Flutter root has no membership transport.
class UnsupportedAgentsMembershipSource implements AgentsMembershipSource {
  const UnsupportedAgentsMembershipSource();

  @override
  Future<AgentsMembershipOverview> loadOverview() {
    throw const SdkworkAgentsCapabilityUnavailableException(
      'membership',
      detail: 'No generated Flutter transport exists for membership plans.',
    );
  }

  @override
  Future<String> createCheckoutUrl(String planId) {
    throw const SdkworkAgentsCapabilityUnavailableException(
      'membership',
      detail: 'No generated Flutter transport exists for membership checkout.',
    );
  }
}

AgentsMembershipSource createUnsupportedAgentsMembershipSource() {
  return const UnsupportedAgentsMembershipSource();
}
