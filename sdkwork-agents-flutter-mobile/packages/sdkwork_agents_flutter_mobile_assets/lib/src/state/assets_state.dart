import '../models/assets_models.dart';

/// Package-local state slice for the asset tab.
class AgentsAssetsState {
  const AgentsAssetsState({
    required this.items,
    required this.kind,
    required this.loading,
    required this.unavailable,
    required this.errorMessage,
  });

  final List<AgentsAssetItem> items;

  /// Active kind filter, or null for "all".
  final AgentsAssetKind? kind;
  final bool loading;

  /// True when the injected source reported that this client has no transport.
  final bool unavailable;
  final String errorMessage;

  AgentsAssetsState copyWith({
    List<AgentsAssetItem>? items,
    AgentsAssetKind? kind,
    bool clearKind = false,
    bool? loading,
    bool? unavailable,
    String? errorMessage,
  }) {
    return AgentsAssetsState(
      items: items ?? this.items,
      kind: clearKind ? null : (kind ?? this.kind),
      loading: loading ?? this.loading,
      unavailable: unavailable ?? this.unavailable,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

AgentsAssetsState initialAgentsAssetsState() {
  return const AgentsAssetsState(
    items: <AgentsAssetItem>[],
    kind: null,
    loading: true,
    unavailable: false,
    errorMessage: '',
  );
}
