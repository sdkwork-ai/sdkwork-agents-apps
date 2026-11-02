/// Inspiration domain models for the Agents Flutter mobile surfaces.
///
/// The feed is delivery-neutral: the injected source maps the service payload
/// onto these records, and the screen never parses transport envelopes.
library;

/// The two inspiration channels the contract exposes (发现 / 精选).
enum AgentsInspirationChannel { discover, featured }

class AgentsInspirationItem {
  const AgentsInspirationItem({
    required this.id,
    required this.title,
    required this.prompt,
    this.author = '',
    this.coverUrl = '',
    this.likes = 0,
    this.aspectRatio,
  });

  final String id;
  final String title;

  /// The prompt text behind the work, shown as the card subtitle.
  final String prompt;
  final String author;
  final String coverUrl;
  final int likes;
  final String? aspectRatio;

  bool get hasCover => coverUrl.isNotEmpty;
}

class AgentsInspirationFeed {
  const AgentsInspirationFeed({required this.items, this.nextCursor});

  final List<AgentsInspirationItem> items;
  final String? nextCursor;
}
