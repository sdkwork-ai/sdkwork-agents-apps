import '../models/canvas_models.dart';

class AgentsCanvasState {
  const AgentsCanvasState({
    required this.workflow,
    required this.loading,
    required this.unavailable,
    required this.errorMessage,
  });

  final AgentsCanvasWorkflow? workflow;
  final bool loading;
  final bool unavailable;
  final String errorMessage;

  bool get isEmpty => workflow == null || workflow!.nodes.isEmpty;

  AgentsCanvasState copyWith({
    AgentsCanvasWorkflow? workflow,
    bool clearWorkflow = false,
    bool? loading,
    bool? unavailable,
    String? errorMessage,
  }) {
    return AgentsCanvasState(
      workflow: clearWorkflow ? null : (workflow ?? this.workflow),
      loading: loading ?? this.loading,
      unavailable: unavailable ?? this.unavailable,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

AgentsCanvasState initialAgentsCanvasState() {
  return const AgentsCanvasState(
    workflow: null,
    loading: true,
    unavailable: false,
    errorMessage: '',
  );
}
