import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/profile_messages.dart';
import '../models/profile_models.dart';
import '../services/profile_identity_source.dart';
import '../state/profile_state.dart';

/// Presentation controller for the profile hub.
class AgentsProfileController extends ChangeNotifier {
  AgentsProfileController({
    required this.source,
    this.loadUsage,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  }) : translate = createAgentsProfileTranslator(localeTag);

  final AgentsProfileIdentitySource source;
  final Future<AgentsProfileUsage?> Function()? loadUsage;
  final String Function(String key) translate;

  AgentsProfileState _state = initialAgentsProfileState();

  AgentsProfileState get state => _state;

  String get retryLabel => translate('agents.profile.retry');

  Future<void> load() async {
    _state = _state.copyWith(loading: true, errorMessage: '');
    notifyListeners();
    try {
      final identity = await source.load();
      AgentsProfileUsage? usage;
      final usageLoader = loadUsage;
      if (usageLoader != null) {
        try {
          usage = await usageLoader();
        } catch (_) {
          usage = null;
        }
      }
      _state = _state.copyWith(
        identity: identity,
        usage: usage,
        clearUsage: usage == null,
        loading: false,
        errorMessage: '',
      );
    } catch (_) {
      _state = _state.copyWith(
        loading: false,
        errorMessage: translate('agents.profile.loadFailed'),
      );
    }
    notifyListeners();
  }
}
