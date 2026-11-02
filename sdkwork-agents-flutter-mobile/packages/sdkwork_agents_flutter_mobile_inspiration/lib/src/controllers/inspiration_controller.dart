import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/inspiration_messages.dart';
import '../models/inspiration_models.dart';
import '../services/inspiration_source.dart';
import '../state/inspiration_state.dart';

/// Presentation controller for the inspiration tab.
///
/// Calls the injected source only; the screen renders the resulting state.
class AgentsInspirationController extends ChangeNotifier {
  AgentsInspirationController({
    required this.source,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  }) : translate = createAgentsInspirationTranslator(localeTag);

  final AgentsInspirationSource source;
  final String Function(String key) translate;

  AgentsInspirationState _state = initialAgentsInspirationState();

  AgentsInspirationState get state => _state;

  String get unavailableHeadline =>
      translate('agents.inspiration.unavailable.title');
  String get unavailableHint =>
      translate('agents.inspiration.unavailable.hint');
  String get retryLabel => translate('agents.inspiration.retry');

  Future<void> load({AgentsInspirationChannel? channel}) async {
    final nextChannel = channel ?? _state.channel;
    _state = _state.copyWith(
      channel: nextChannel,
      loading: true,
      unavailable: false,
      errorMessage: '',
    );
    notifyListeners();
    try {
      final feed = await source.loadFeed(nextChannel);
      _state = _state.copyWith(
        items: feed.items,
        loading: false,
        unavailable: false,
        errorMessage: '',
      );
    } on SdkworkAgentsCapabilityUnavailableException {
      _state = _state.copyWith(
        items: const <AgentsInspirationItem>[],
        loading: false,
        unavailable: true,
        errorMessage: translate('agents.inspiration.unavailable.title'),
      );
    } catch (_) {
      _state = _state.copyWith(
        items: const <AgentsInspirationItem>[],
        loading: false,
        unavailable: false,
        errorMessage: translate('agents.inspiration.loadFailed'),
      );
    }
    notifyListeners();
  }

  Future<void> selectChannel(AgentsInspirationChannel channel) =>
      load(channel: channel);
}
