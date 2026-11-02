import 'package:flutter/foundation.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../copy/assets_messages.dart';
import '../models/assets_models.dart';
import '../services/assets_source.dart';
import '../state/assets_state.dart';

/// Presentation controller for the asset tab.
class AgentsAssetsController extends ChangeNotifier {
  AgentsAssetsController({
    required this.source,
    String localeTag = sdkworkAgentsDefaultLocaleTag,
    DateTime Function()? now,
  })  : translate = createAgentsAssetsTranslator(localeTag),
        _now = now ?? DateTime.now;

  final AgentsAssetsSource source;
  final String Function(String key) translate;
  final DateTime Function() _now;

  AgentsAssetsState _state = initialAgentsAssetsState();

  AgentsAssetsState get state => _state;

  String get retryLabel => translate('agents.assets.retry');

  List<AgentsAssetItem> get visibleItems =>
      filterAgentsAssets(_state.items, _state.kind);

  List<AgentsAssetGroup> get groups => groupAgentsAssetsByDate(visibleItems);

  /// Localized label for one date bucket.
  String groupLabel(String dateKey) {
    if (dateKey == agentsAssetUnknownDateKey) {
      return translate('agents.assets.date.unknown');
    }
    final now = _now();
    final today = _dateKey(now);
    final yesterday = _dateKey(now.subtract(const Duration(days: 1)));
    if (dateKey == today) {
      return translate('agents.assets.date.today');
    }
    if (dateKey == yesterday) {
      return translate('agents.assets.date.yesterday');
    }
    // ISO calendar day is locale-neutral; no untranslated English copy leaks.
    return dateKey;
  }

  Future<void> load() async {
    _state =
        _state.copyWith(loading: true, unavailable: false, errorMessage: '');
    notifyListeners();
    try {
      final items = await source.listAssets();
      final sorted = List<AgentsAssetItem>.from(items)
        ..sort(_compareNewestFirst);
      _state = _state.copyWith(
        items: sorted,
        loading: false,
        unavailable: false,
        errorMessage: '',
      );
    } on SdkworkAgentsCapabilityUnavailableException {
      _state = _state.copyWith(
        items: const <AgentsAssetItem>[],
        loading: false,
        unavailable: true,
        errorMessage: translate('agents.assets.unavailable.title'),
      );
    } catch (_) {
      _state = _state.copyWith(
        items: const <AgentsAssetItem>[],
        loading: false,
        unavailable: false,
        errorMessage: translate('agents.assets.loadFailed'),
      );
    }
    notifyListeners();
  }

  void selectKind(AgentsAssetKind? kind) {
    _state = kind == null
        ? _state.copyWith(clearKind: true)
        : _state.copyWith(kind: kind);
    notifyListeners();
  }

  static int _compareNewestFirst(AgentsAssetItem left, AgentsAssetItem right) {
    final leftDate = left.createdAtDate;
    final rightDate = right.createdAtDate;
    if (leftDate == null && rightDate == null) {
      return 0;
    }
    if (leftDate == null) {
      return 1;
    }
    if (rightDate == null) {
      return -1;
    }
    return rightDate.compareTo(leftDate);
  }

  static String _dateKey(DateTime value) {
    final month = value.month.toString().padLeft(2, '0');
    final day = value.day.toString().padLeft(2, '0');
    return '${value.year}-$month-$day';
  }
}
