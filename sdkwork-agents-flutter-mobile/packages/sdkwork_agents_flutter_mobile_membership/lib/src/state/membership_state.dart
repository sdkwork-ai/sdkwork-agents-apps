import '../models/membership_models.dart';

/// Package-local state slice for the membership catalog.
class AgentsMembershipState {
  const AgentsMembershipState({
    required this.overview,
    required this.loading,
    required this.unavailable,
    required this.errorMessage,
    required this.checkoutPlanId,
    required this.checkoutUrl,
  });

  final AgentsMembershipOverview? overview;
  final bool loading;

  /// True when the injected source reported that this client has no transport.
  final bool unavailable;
  final String errorMessage;

  /// Plan currently creating a checkout entry, or null.
  final String? checkoutPlanId;
  final String? checkoutUrl;

  AgentsMembershipState copyWith({
    AgentsMembershipOverview? overview,
    bool? loading,
    bool? unavailable,
    String? errorMessage,
    String? checkoutPlanId,
    String? checkoutUrl,
    bool clearCheckoutPlan = false,
    bool clearCheckoutUrl = false,
  }) {
    return AgentsMembershipState(
      overview: overview ?? this.overview,
      loading: loading ?? this.loading,
      unavailable: unavailable ?? this.unavailable,
      errorMessage: errorMessage ?? this.errorMessage,
      checkoutPlanId:
          clearCheckoutPlan ? null : (checkoutPlanId ?? this.checkoutPlanId),
      checkoutUrl: clearCheckoutUrl ? null : (checkoutUrl ?? this.checkoutUrl),
    );
  }
}

AgentsMembershipState initialAgentsMembershipState() {
  return const AgentsMembershipState(
    overview: null,
    loading: true,
    unavailable: false,
    errorMessage: '',
    checkoutPlanId: null,
    checkoutUrl: null,
  );
}
