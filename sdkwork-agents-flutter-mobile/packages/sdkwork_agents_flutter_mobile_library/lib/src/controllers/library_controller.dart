import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/library_messages.dart';
import '../models/library_models.dart';
import '../services/library_service.dart';
import '../state/library_state.dart';

/// Presentation controller for the library tab.
///
/// Owns UI state mapping and calls the service only
/// (`FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` section 4 — `controllers/`).
class AgentsLibraryController extends ChangeNotifier {
  AgentsLibraryController({
    required this.service,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
  }) : translate = createAgentsLibraryTranslator(localeTag);

  final AgentsLibraryService service;
  final String Function(String key) translate;

  AgentsLibraryState _state = initialAgentsLibraryState();

  AgentsLibraryState get state => _state;

  /// Files matching the active search query.
  List<AgentsLibraryFile> get visibleFiles =>
      filterAgentsLibraryFiles(_state.files, _state.query);

  void updateQuery(String query) {
    _state = _state.copyWith(query: query);
    notifyListeners();
  }

  Future<void> load() async {
    _state = _state.copyWith(loading: true, errorMessage: '');
    notifyListeners();
    try {
      final listing = await service.loadFiles();
      _state = _state.copyWith(
        files: listing.items,
        truncated: listing.truncated,
        loading: false,
        errorMessage: '',
      );
    } catch (_) {
      _state = _state.copyWith(
        files: const <AgentsLibraryFile>[],
        truncated: false,
        loading: false,
        errorMessage: translate('agents.library.loadFailed'),
      );
    }
    notifyListeners();
  }

  /// Resolves a URL for [fileId], returning `null` and surfacing an error when
  /// the entry cannot be opened.
  Future<String?> resolveOpenUrl(String fileId) async {
    try {
      return await service.source.resolvePreviewUrl(fileId);
    } catch (_) {
      _state = _state.copyWith(errorMessage: translate('agents.library.openFailed'));
      notifyListeners();
      return null;
    }
  }
}
