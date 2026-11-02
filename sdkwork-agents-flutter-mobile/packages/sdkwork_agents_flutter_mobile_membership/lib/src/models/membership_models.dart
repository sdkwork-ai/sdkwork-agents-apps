/// Membership catalog models for the Agents Flutter mobile surfaces.
///
/// The view models mirror the PC membership overlay's catalog contract: a
/// current membership summary plus a list of purchasable plans. Values come
/// from the injected source; the screen never invents prices or tiers.
library;

class AgentsMembershipPlan {
  const AgentsMembershipPlan({
    required this.id,
    required this.name,
    required this.description,
    required this.priceLabel,
    required this.periodLabel,
    this.features = const <String>[],
    this.isCurrent = false,
    this.isRecommended = false,
  });

  final String id;
  final String name;
  final String description;
  final String priceLabel;
  final String periodLabel;
  final List<String> features;
  final bool isCurrent;
  final bool isRecommended;
}

class AgentsMembershipSummary {
  const AgentsMembershipSummary({
    required this.isMember,
    required this.tierName,
    required this.pointBalance,
    this.expiresAt,
  });

  final bool isMember;
  final String tierName;

  /// Points balance kept as a decimal string (`API_SPEC.md` section 13.6).
  final String pointBalance;
  final String? expiresAt;
}

class AgentsMembershipOverview {
  const AgentsMembershipOverview({required this.summary, required this.plans});

  final AgentsMembershipSummary summary;
  final List<AgentsMembershipPlan> plans;
}
