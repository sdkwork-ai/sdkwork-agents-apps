/// Canvas workflow view models.
///
/// The PC canvas owns a browser-local graph. Mobile renders a read-only,
/// viewport-constrained projection; editing stays a PC/tablet capability.
library;

enum AgentsCanvasNodeType {
  text('text', 'agents.canvas.node.text'),
  imageGen('image-gen', 'agents.canvas.node.imageGen'),
  videoGen('video-gen', 'agents.canvas.node.videoGen'),
  flowStep('flow-step', 'agents.canvas.node.flowStep'),
  sticky('sticky', 'agents.canvas.node.sticky');

  const AgentsCanvasNodeType(this.wireValue, this.labelKey);

  final String wireValue;
  final String labelKey;

  static AgentsCanvasNodeType fromWire(String? value) {
    final normalized = (value ?? '').trim();
    for (final type in AgentsCanvasNodeType.values) {
      if (type.wireValue == normalized) {
        return type;
      }
    }
    return AgentsCanvasNodeType.text;
  }
}

enum AgentsCanvasNodeStatus {
  idle('idle', 'agents.canvas.status.idle'),
  generating('generating', 'agents.canvas.status.generating'),
  completed('completed', 'agents.canvas.status.completed'),
  failed('failed', 'agents.canvas.status.failed');

  const AgentsCanvasNodeStatus(this.wireValue, this.labelKey);

  final String wireValue;
  final String labelKey;

  static AgentsCanvasNodeStatus? fromWire(String? value) {
    for (final status in AgentsCanvasNodeStatus.values) {
      if (status.wireValue == value) {
        return status;
      }
    }
    return null;
  }
}

class AgentsCanvasNode {
  const AgentsCanvasNode({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.status,
    required this.mediaUrl,
  });

  final String id;
  final AgentsCanvasNodeType type;
  final String title;
  final String body;
  final AgentsCanvasNodeStatus? status;
  final String? mediaUrl;
}

class AgentsCanvasWorkflow {
  const AgentsCanvasWorkflow({
    required this.nodes,
    required this.connectionCount,
  });

  final List<AgentsCanvasNode> nodes;
  final int connectionCount;
}

/// Parses the persisted PC graph defensively; malformed entries are dropped
/// instead of failing the whole page.
AgentsCanvasWorkflow? parseAgentsCanvasWorkflow(Object? value) {
  if (value is! Map) {
    return null;
  }
  final rawNodes = value['nodes'];
  if (rawNodes is! List) {
    return null;
  }
  final nodes = <AgentsCanvasNode>[];
  for (final raw in rawNodes) {
    if (raw is! Map) {
      continue;
    }
    final id = raw['id']?.toString() ?? '';
    if (id.isEmpty) {
      continue;
    }
    final type = AgentsCanvasNodeType.fromWire(raw['type']?.toString());
    final content = raw['content']?.toString() ?? '';
    final prompt = raw['prompt']?.toString() ?? '';
    final mediaUrl = raw['mediaUrl']?.toString();
    nodes.add(
      AgentsCanvasNode(
        id: id,
        type: type,
        title: raw['title']?.toString() ?? '',
        body: content.isNotEmpty ? content : prompt,
        status: AgentsCanvasNodeStatus.fromWire(raw['status']?.toString()),
        mediaUrl: mediaUrl != null && mediaUrl.isNotEmpty ? mediaUrl : null,
      ),
    );
  }
  final rawConnections = value['connections'];
  final connectionCount = rawConnections is List ? rawConnections.length : 0;
  nodes.sort((AgentsCanvasNode left, AgentsCanvasNode right) {
    final leftY = _num(value, left.id, 'y');
    final rightY = _num(value, right.id, 'y');
    if (leftY != rightY) {
      return leftY.compareTo(rightY);
    }
    return _num(value, left.id, 'x').compareTo(_num(value, right.id, 'x'));
  });
  return AgentsCanvasWorkflow(
    nodes: List<AgentsCanvasNode>.unmodifiable(nodes),
    connectionCount: connectionCount,
  );
}

double _num(Map<dynamic, dynamic> workflow, String id, String key) {
  final rawNodes = workflow['nodes'];
  if (rawNodes is! List) {
    return 0;
  }
  for (final raw in rawNodes) {
    if (raw is Map && raw['id']?.toString() == id) {
      final value = raw[key];
      if (value is num) {
        return value.toDouble();
      }
      return double.tryParse(value?.toString() ?? '') ?? 0;
    }
  }
  return 0;
}
