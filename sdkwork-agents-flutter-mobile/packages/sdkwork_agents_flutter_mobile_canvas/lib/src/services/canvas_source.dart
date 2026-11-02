import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/canvas_models.dart';

/// Data port for the read-only canvas projection.
abstract class AgentsCanvasSource {
  Future<AgentsCanvasWorkflow?> loadWorkflow();
}

/// Source used when the root has no local canvas store composed.
class AgentsUnavailableCanvasSource implements AgentsCanvasSource {
  const AgentsUnavailableCanvasSource();

  @override
  Future<AgentsCanvasWorkflow?> loadWorkflow() {
    throw const SdkworkAgentsCapabilityUnavailableException(
      'Canvas is not composed for this client root.',
    );
  }
}
