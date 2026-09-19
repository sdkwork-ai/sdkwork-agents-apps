/// Library domain models for the Agents Flutter mobile surfaces.
///
/// The library tab lists artifacts the Agents runtime persisted to Drive. The
/// view model is deliberately transport-neutral: whichever source the
/// composition root injects (Drive nodes today, the Agents media-asset
/// projection on Dart, a future Dart Drive app SDK target) maps onto the same
/// shape, so the screen never changes.
library;

class AgentsLibraryFile {
  const AgentsLibraryFile({
    required this.id,
    required this.name,
    this.mimeType,
    this.sizeBytes,
    this.updatedAt,
    this.spaceId,
    this.driveUri,
    this.sourceUrl,
  });

  final String id;
  final String name;
  final String? mimeType;

  /// Size in bytes, kept as a decimal string (`API_SPEC.md` section 13.6 keeps
  /// int64 off the `num` plane).
  final String? sizeBytes;
  final String? updatedAt;
  final String? spaceId;

  /// `drive://` reference of the persisted node, when the source exposes one.
  final String? driveUri;

  /// Short-lived or origin URL the platform can open directly, when available.
  final String? sourceUrl;
}

class AgentsLibraryPage {
  const AgentsLibraryPage({required this.items, this.nextCursor});

  final List<AgentsLibraryFile> items;
  final String? nextCursor;
}

/// Result of draining the listing for a tab that shows the whole library.
class AgentsLibraryListing {
  const AgentsLibraryListing({required this.items, required this.truncated});

  final List<AgentsLibraryFile> items;

  /// True when the drain stopped at the page ceiling with more rows remaining.
  final bool truncated;
}
