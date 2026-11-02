import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/membership_messages.dart';
import '../models/membership_models.dart';
import '../services/membership_source.dart';
import '../state/membership_state.dart';

/// Presentation controller for the membership catalog.
class AgentsMembershipController extends ChangeNotifier {
  AgentsMembershipController({
    required this.source,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  }) : translate = createAgentsMembershipTranslator(localeTag);

  final AgentsMembershipSource source;
  final String Function(String key) translate;

  AgentsMembershipState _state = initialAgentsMembershipState();

  AgentsMembershipState get state => _state;

  List<AgentsMembershipPlan> get plans =>
      _state.overview?.plans ?? const <AgentsMembershipPlan>[];

  Future<void> load() async {
    _state = _state.copyWith(
      loading: true,
      unavailable: false,
      errorMessage: '',
      clearCheckoutUrl: true,
    );
    notifyListeners();
    try {
      final overview = await source.loadOverview();
      _state = _state.copyWith(
        overview: overview,
        loading: false,
        unavailable: false,
        errorMessage: '',
      );
    } on SdkworkAgentsCapabilityUnavailableException {
      _state = _state.copyWith(
        loading: false,
        unavailable: true,
        errorMessage: translate('agents.membership.unavailable.title'),
      );
    } catch (_) {
      _state = _state.copyWith(
        loading: false,
        unavailable: false,
        errorMessage: translate('agents.membership.loadFailed'),
      );
    }
    notifyListeners();
  }

  Future<void> checkout(String planId) async {
    if (_state.checkoutPlanId != null) {
      return;
    }
    _state = _state.copyWith(
      checkoutPlanId: planId,
      errorMessage: '',
      clearCheckoutUrl: true,
    );
    notifyListeners();
    try {
      final url = await source.createCheckoutUrl(planId);
      _state = _state.copyWith(
        clearCheckoutPlan: true,
        checkoutUrl: url,
      );
    } on SdkworkAgentsCapabilityUnavailableException {
      _state = _state.copyWith(
        clearCheckoutPlan: true,
        unavailable: true,
        errorMessage: translate('agents.membership.checkoutUnavailable'),
      );
    } catch (_) {
      _state = _state.copyWith(
        clearCheckoutPlan: true,
        errorMessage: translate('agents.membership.loadFailed'),
      );
    }
    notifyListeners();
  }

  void dismissCheckout() {
    _state = _state.copyWith(clearCheckoutUrl: true);
    notifyListeners();
  }
}
