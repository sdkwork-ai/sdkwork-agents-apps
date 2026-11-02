import '../models/inspiration_models.dart';

/// Package-local state slice for the inspiration tab.
class AgentsInspirationState {
  const AgentsInspirationState({
    required this.channel,
    required this.items,
    required this.loading,
    required this.unavailable,
    required this.errorMessage,
  });

  final AgentsInspirationChannel channel;
  final List<AgentsInspirationItem> items;
  final bool loading;

  /// True when the injected source reported that this client has no transport.
  final bool unavailable;
  final String errorMessage;

  AgentsInspirationState copyWith({
    AgentsInspirationChannel? channel,
    List<AgentsInspirationItem>? items,
    bool? loading,
    bool? unavailable,
    String? errorMessage,
  }) {
    return AgentsInspirationState(
      channel: channel ?? this.channel,
      items: items ?? this.items,
      loading: loading ?? this.loading,
      unavailable: unavailable ?? this.unavailable,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

AgentsInspirationState initialAgentsInspirationState() {
  return const AgentsInspirationState(
    channel: AgentsInspirationChannel.discover,
    items: <AgentsInspirationItem>[],
    loading: true,
    unavailable: false,
    errorMessage: '',
  );
}
