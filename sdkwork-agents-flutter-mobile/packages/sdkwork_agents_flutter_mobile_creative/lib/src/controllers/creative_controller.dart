import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/creative_messages.dart';
import '../models/creative_models.dart';
import '../services/creative_source.dart';
import '../state/creative_state.dart';

/// Presentation controller for the creative studio.
class AgentsCreativeController extends ChangeNotifier {
  AgentsCreativeController({
    required this.source,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  }) : translate = createAgentsCreativeTranslator(localeTag);

  final AgentsCreativeSource source;
  final String Function(String key) translate;

  AgentsCreativeState _state = initialAgentsCreativeState();

  AgentsCreativeState get state => _state;

  String get retryLabel => translate('agents.creative.retry');

  void updatePrompt(String prompt) {
    _state = _state.copyWith(prompt: prompt);
    notifyListeners();
  }

  void selectModality(AgentsCreativeModality modality) {
    _state = _state.copyWith(modality: modality);
    notifyListeners();
  }

  void selectAspectRatio(AgentsCreativeAspectRatio aspectRatio) {
    _state = _state.copyWith(aspectRatio: aspectRatio);
    notifyListeners();
  }

  Future<void> loadSessions() async {
    _state = _state.copyWith(
      loadingSessions: true,
      unavailable: false,
      errorMessage: '',
    );
    notifyListeners();
    try {
      final page = await source.listSessions();
      _state = _state.copyWith(
        sessions: page.items,
        loadingSessions: false,
        unavailable: false,
      );
    } on SdkworkAgentsCapabilityUnavailableException {
      _state = _state.copyWith(
        sessions: const <AgentsCreativeSessionSummary>[],
        loadingSessions: false,
        unavailable: true,
        errorMessage: translate('agents.creative.unavailable.title'),
      );
    } catch (_) {
      _state = _state.copyWith(
        sessions: const <AgentsCreativeSessionSummary>[],
        loadingSessions: false,
        unavailable: false,
        errorMessage: translate('agents.creative.sessions.loadFailed'),
      );
    }
    notifyListeners();
  }

  Future<void> selectSession(String sessionId) async {
    try {
      final session = await source.loadSession(sessionId);
      _state = _state.copyWith(
        activeSession: session,
        unavailable: false,
        errorMessage: '',
      );
    } on SdkworkAgentsCapabilityUnavailableException {
      _state = _state.copyWith(
        unavailable: true,
        errorMessage: translate('agents.creative.unavailable.title'),
      );
    } catch (_) {
      _state = _state.copyWith(
        errorMessage: translate('agents.creative.sessionLoadFailed'),
      );
    }
    notifyListeners();
  }

  Future<void> submit() async {
    final prompt = _state.prompt.trim();
    if (prompt.isEmpty || _state.submitting) {
      return;
    }
    _state = _state.copyWith(submitting: true, errorMessage: '');
    notifyListeners();
    try {
      final submission = await source.submit(
        prompt: prompt,
        modality: _state.modality,
        aspectRatio: _state.aspectRatio,
      );
      _state = _state.copyWith(
        submitting: false,
        prompt: '',
        unavailable: false,
      );
      notifyListeners();
      await loadSessions();
      await selectSession(submission.sessionId);
    } on SdkworkAgentsCapabilityUnavailableException {
      _state = _state.copyWith(
        submitting: false,
        unavailable: true,
        errorMessage: translate('agents.creative.unavailable.title'),
      );
      notifyListeners();
    } catch (_) {
      _state = _state.copyWith(
        submitting: false,
        errorMessage: translate('agents.creative.submitFailed'),
      );
      notifyListeners();
    }
  }

  Future<void> retry() => loadSessions();
}
