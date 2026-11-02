/// Creative studio models for the Agents Flutter mobile surfaces.
library;

/// Studio modality. Wire values match the PC generation modality vocabulary.
enum AgentsCreativeModality {
  image('image', 'agents.creative.modality.image'),
  video('video', 'agents.creative.modality.video'),
  music('music', 'agents.creative.modality.music'),
  voice('voice', 'agents.creative.modality.voice'),
  sfx('sfx', 'agents.creative.modality.sfx');

  const AgentsCreativeModality(this.wireValue, this.labelKey);

  final String wireValue;
  final String labelKey;
}

/// Output aspect ratio offered by the studio.
enum AgentsCreativeAspectRatio {
  square('1:1', 'agents.creative.aspect.square'),
  portrait('3:4', 'agents.creative.aspect.portrait'),
  landscape('16:9', 'agents.creative.aspect.landscape');

  const AgentsCreativeAspectRatio(this.wireValue, this.labelKey);

  final String wireValue;
  final String labelKey;

  /// Human label for the ratio, independent of locale.
  String get ratioLabel => wireValue;
}

enum AgentsCreativeResultKind { image, video, audio, other }

class AgentsCreativeResult {
  const AgentsCreativeResult({
    required this.id,
    required this.url,
    required this.kind,
    this.thumbnailUrl,
  });

  final String id;
  final String url;
  final AgentsCreativeResultKind kind;
  final String? thumbnailUrl;

  String get previewUrl => thumbnailUrl ?? url;

  /// Only raster images render directly in the result grid.
  bool get isRenderableImage => kind == AgentsCreativeResultKind.image;
}

class AgentsCreativeSessionSummary {
  const AgentsCreativeSessionSummary({
    required this.id,
    required this.title,
    this.resultCount = 0,
    this.createdAt,
  });

  final String id;
  final String title;
  final int resultCount;
  final String? createdAt;
}

class AgentsCreativeSession {
  const AgentsCreativeSession({required this.summary, required this.results});

  final AgentsCreativeSessionSummary summary;
  final List<AgentsCreativeResult> results;
}

class AgentsCreativeSessionPage {
  const AgentsCreativeSessionPage({required this.items, this.nextCursor});

  final List<AgentsCreativeSessionSummary> items;
  final String? nextCursor;
}

class AgentsCreativeSubmission {
  const AgentsCreativeSubmission(
      {required this.sessionId, required this.status});

  final String sessionId;
  final String status;
}
