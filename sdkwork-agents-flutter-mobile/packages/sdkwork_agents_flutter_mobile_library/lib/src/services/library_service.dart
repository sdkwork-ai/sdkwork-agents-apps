/// Library orchestration for the Agents Flutter mobile root.
///
/// The library is Drive-owned: this service reads persisted artifacts and never
/// mutates them. The source is injected through [AgentsLibrarySource] so this
/// package has no compile-time dependency on a Drive SDK package — and so the
/// composition root can swap the backing surface without touching the screen
/// (`FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` section 4,
/// `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 5).
library;

import 'package:sdkwork_agents_app_sdk/sdkwork_agents_app_sdk.dart';
import 'package:sdkwork_agents_flutter_mobile_core/sdkwork_agents_flutter_mobile_core.dart';

import '../models/library_models.dart';

const int agentsLibraryDefaultPageSize = 100;

/// Page ceiling for the tab drain; the library tab shows everything at once.
const int agentsLibraryMaxPages = 5;

/// Supplies library entries. Implementations own their transport.
abstract class AgentsLibrarySource {
  Future<AgentsLibraryPage> listFiles({int pageSize, String? cursor});

  /// Short-lived download URL used to open a file.
  Future<String> resolvePreviewUrl(String fileId);
}

abstract class AgentsLibraryService {
  AgentsLibrarySource get source;

  /// Drains the listing up to [agentsLibraryMaxPages] for a tab that shows the
  /// whole library at once. Not a batch/export helper (`PAGINATION_SPEC.md`).
  Future<AgentsLibraryListing> loadFiles();
}

AgentsLibraryService createAgentsLibraryService(AgentsLibrarySource source) {
  return _AgentsLibraryServiceImpl(source: source);
}

class _AgentsLibraryServiceImpl implements AgentsLibraryService {
  _AgentsLibraryServiceImpl({required this.source});

  @override
  final AgentsLibrarySource source;

  @override
  Future<AgentsLibraryListing> loadFiles() async {
    final collected = <AgentsLibraryFile>[];
    final seen = <String>{};
    String? cursor;
    for (var page = 0; page < agentsLibraryMaxPages; page += 1) {
      final result = await source.listFiles(
        pageSize: agentsLibraryDefaultPageSize,
        cursor: cursor,
      );
      for (final file in result.items) {
        if (seen.add(file.id)) {
          collected.add(file);
        }
      }
      cursor = result.nextCursor;
      if (cursor == null || cursor.isEmpty || result.items.isEmpty) {
        return AgentsLibraryListing(items: collected, truncated: false);
      }
    }
    return AgentsLibraryListing(items: collected, truncated: true);
  }
}

/// Maps one Drive node record onto the library view model.
AgentsLibraryFile? mapAgentsLibraryDriveNode(Map<String, dynamic> node) {
  final id = node['id'] ?? node['nodeId'];
  if (id is! String || id.isEmpty) {
    return null;
  }
  return AgentsLibraryFile(
    id: id,
    name: node['nodeName']?.toString() ?? id,
    mimeType: node['contentType']?.toString(),
    sizeBytes: node['contentLength']?.toString(),
    updatedAt: node['updatedAt']?.toString(),
    spaceId: node['spaceId']?.toString(),
  );
}

/// Maps one Agents media-asset record onto the library view model.
///
/// `GET /ai/assets` lists media assets the runtime persisted to Drive; each row
/// carries the Drive node it produced. This is the surface available to a Dart
/// client today, because `sdkwork-drive-app-sdk` publishes no Flutter target.
AgentsLibraryFile? mapAgentsLibraryAsset(Map<String, dynamic> asset) {
  final nodeId = asset['driveNodeId'];
  if (nodeId is! String || nodeId.isEmpty) {
    return null;
  }
  final mediaKind = asset['mediaKind']?.toString();
  final toolId = asset['toolId']?.toString();
  final label = mediaKind != null && mediaKind.isNotEmpty
      ? mediaKind
      : (toolId != null && toolId.isNotEmpty ? toolId : nodeId);
  return AgentsLibraryFile(
    id: nodeId,
    name: '$label · $nodeId',
    mimeType: mediaKind,
    updatedAt: asset['createdAt']?.toString(),
    spaceId: asset['driveSpaceId']?.toString(),
    driveUri: asset['driveUri']?.toString(),
    sourceUrl: asset['sourceUrl']?.toString(),
  );
}

List<AgentsLibraryFile> filterAgentsLibraryFiles(
  List<AgentsLibraryFile> files,
  String query,
) {
  final needle = query.trim().toLowerCase();
  if (needle.isEmpty) {
    return List<AgentsLibraryFile>.from(files);
  }
  return files
      .where((AgentsLibraryFile file) => file.name.toLowerCase().contains(needle))
      .toList(growable: false);
}

/// Library source backed by the Agents app API media-asset surface.
///
/// Consumer-side gap, recorded deliberately: `sdkwork-drive-app-sdk` ships Go,
/// Java, Python, Rust, and TypeScript targets only, so a Dart client cannot read
/// Drive property nodes (`drive.propertyNodes.list`) or mint download URLs
/// (`drive.nodes.downloadUrls.retrieve`) the way the PC, H5, and mini program
/// roots do. Until that target exists, this root surfaces the Agents-owned
/// projection of the same Drive objects. Swapping in a Drive-backed source is a
/// one-line change at the composition root, because the screen depends on
/// [AgentsLibrarySource] only.
AgentsLibrarySource createAgentsAssetLibrarySource(SdkworkAppClient client) {
  return _AgentsAssetLibrarySource(client: client);
}

class _AgentsAssetLibrarySource implements AgentsLibrarySource {
  _AgentsAssetLibrarySource({required this.client});

  final SdkworkAppClient client;

  /// Last listing this source returned, so opening a row does not refetch the
  /// whole asset page.
  final Map<String, AgentsLibraryFile> _cache = <String, AgentsLibraryFile>{};

  @override
  Future<AgentsLibraryPage> listFiles({
    int pageSize = agentsLibraryDefaultPageSize,
    String? cursor,
  }) async {
    final response = await client.ai.agentsAssetsList();
    final files = <AgentsLibraryFile>[];
    for (final record in sdkworkAgentsPageItems(response?.data)) {
      final mapped = mapAgentsLibraryAsset(record);
      if (mapped != null) {
        files.add(mapped);
        _cache[mapped.id] = mapped;
      }
    }
    // The asset listing is a single bounded response, so the whole set is
    // returned in one page and the cursor chain terminates here.
    return AgentsLibraryPage(items: files);
  }

  @override
  Future<String> resolvePreviewUrl(String fileId) async {
    var cached = _cache[fileId];
    if (cached == null) {
      await listFiles();
      cached = _cache[fileId];
    }
    final sourceUrl = cached?.sourceUrl;
    if (sourceUrl != null && sourceUrl.isNotEmpty) {
      return sourceUrl;
    }
    final driveUri = cached?.driveUri;
    if (driveUri != null && driveUri.isNotEmpty) {
      return driveUri;
    }
    throw StateError('No preview URL is available for library entry $fileId.');
  }
}
