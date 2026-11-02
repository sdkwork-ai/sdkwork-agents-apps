import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/canvas_messages.dart';
import '../services/canvas_source.dart';
import '../state/canvas_state.dart';

class AgentsCanvasController extends ChangeNotifier {
  AgentsCanvasController({
    required this.source,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  }) : translate = createAgentsCanvasTranslator(localeTag);

  final AgentsCanvasSource source;
  final String Function(String key) translate;

  AgentsCanvasState _state = initialAgentsCanvasState();

  AgentsCanvasState get state => _state;

  String connectionsLabel(int count) {
    return translate('agents.canvas.connections')
        .replaceAll('{{count}}', count.toString());
  }

  Future<void> load() async {
    _state = _state.copyWith(
      loading: true,
      unavailable: false,
      errorMessage: '',
    );
    notifyListeners();
    try {
      final workflow = await source.loadWorkflow();
      _state = _state.copyWith(
        workflow: workflow,
        clearWorkflow: workflow == null,
        loading: false,
        unavailable: false,
        errorMessage: '',
      );
    } on SdkworkAgentsCapabilityUnavailableException {
      _state = _state.copyWith(
        clearWorkflow: true,
        loading: false,
        unavailable: true,
        errorMessage: translate('agents.canvas.unavailable.title'),
      );
    } catch (_) {
      _state = _state.copyWith(
        clearWorkflow: true,
        loading: false,
        unavailable: false,
        errorMessage: translate('agents.canvas.loadFailed'),
      );
    }
    notifyListeners();
  }
}
