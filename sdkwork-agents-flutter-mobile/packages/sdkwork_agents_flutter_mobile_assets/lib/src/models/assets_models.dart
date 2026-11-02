/// Asset library models for the Agents Flutter mobile surfaces.
///
/// The asset tab reads the Agents-owned `/ai/assets` projection of media the
/// runtime persisted to Drive (`ToolAssetView`). The view model is
/// transport-neutral so a future Drive-target source maps onto the same shape.
library;

enum AgentsAssetKind {
  image('image', 'agents.assets.kind.image'),
  video('video', 'agents.assets.kind.video'),
  audio('audio', 'agents.assets.kind.audio'),
  document('document', 'agents.assets.kind.document'),
  other('other', 'agents.assets.kind.other');

  const AgentsAssetKind(this.wireValue, this.labelKey);

  final String wireValue;
  final String labelKey;

  static AgentsAssetKind fromWire(String? value) {
    final normalized = (value ?? '').trim().toLowerCase();
    for (final kind in AgentsAssetKind.values) {
      if (kind.wireValue == normalized) {
        return kind;
      }
    }
    return AgentsAssetKind.other;
  }
}

class AgentsAssetItem {
  const AgentsAssetItem({
    required this.id,
    required this.kind,
    required this.mediaKind,
    this.toolId,
    this.createdAt,
    this.driveUri,
    this.sourceUrl,
  });

  /// Drive node id, the stable identity of the persisted asset.
  final String id;
  final AgentsAssetKind kind;

  /// Raw `mediaKind` from the wire, kept for display and diagnostics.
  final String mediaKind;
  final String? toolId;
  final String? createdAt;
  final String? driveUri;
  final String? sourceUrl;

  bool get hasPreview => sourceUrl != null && sourceUrl!.isNotEmpty;

  /// Parsed creation instant, or null when the wire value is absent/invalid.
  DateTime? get createdAtDate {
    final raw = createdAt;
    if (raw == null || raw.isEmpty) {
      return null;
    }
    return DateTime.tryParse(raw)?.toLocal();
  }
}

/// One date bucket in the asset grid, newest bucket first.
class AgentsAssetGroup {
  const AgentsAssetGroup({required this.dateKey, required this.items});

  /// `yyyy-MM-dd` key, or `unknown` when the wire carried no usable timestamp.
  final String dateKey;
  final List<AgentsAssetItem> items;
}

const String agentsAssetUnknownDateKey = 'unknown';

AgentsAssetKind? agentsAssetKindFilter(String? value) {
  if (value == null || value.isEmpty) {
    return null;
  }
  return AgentsAssetKind.fromWire(value);
}
