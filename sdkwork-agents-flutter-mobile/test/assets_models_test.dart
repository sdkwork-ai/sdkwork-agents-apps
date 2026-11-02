import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_agents_flutter_mobile_assets/sdkwork_agents_flutter_mobile_assets.dart';

void main() {
  test('maps a ToolAssetView record onto the asset view model', () {
    final item = mapAgentsAssetRecord(<String, dynamic>{
      'driveNodeId': 'node-1',
      'mediaKind': 'image',
      'toolId': 'image.generate',
      'createdAt': '2026-11-02T10:00:00',
      'driveUri': 'drive://spaces/s1/nodes/node-1',
      'sourceUrl': 'https://cdn.example.test/a.png',
    });
    expect(item, isNotNull);
    expect(item!.id, 'node-1');
    expect(item.kind, AgentsAssetKind.image);
    expect(item.toolId, 'image.generate');
    expect(item.hasPreview, isTrue);
    expect(item.createdAtDate, isNotNull);
  });

  test('unknown media kinds map to other and missing ids are dropped', () {
    expect(AgentsAssetKind.fromWire('spreadsheet'), AgentsAssetKind.other);
    expect(
      mapAgentsAssetRecord(<String, dynamic>{'mediaKind': 'image'}),
      isNull,
    );
  });

  test('filters by kind and groups newest day first with undated last', () {
    final image = AgentsAssetItem(
      id: 'a',
      kind: AgentsAssetKind.image,
      mediaKind: 'image',
      createdAt: '2026-11-02T10:00:00',
    );
    final olderImage = AgentsAssetItem(
      id: 'b',
      kind: AgentsAssetKind.image,
      mediaKind: 'image',
      createdAt: '2026-11-01T12:00:00',
    );
    final audio = AgentsAssetItem(
      id: 'c',
      kind: AgentsAssetKind.audio,
      mediaKind: 'audio',
      createdAt: '2026-11-02T09:00:00',
    );
    final undated = AgentsAssetItem(
      id: 'd',
      kind: AgentsAssetKind.other,
      mediaKind: 'other',
    );

    expect(filterAgentsAssets(<AgentsAssetItem>[image, audio], null).length, 2);
    expect(
      filterAgentsAssets(<AgentsAssetItem>[
        image,
        audio,
      ], AgentsAssetKind.audio).map((AgentsAssetItem item) => item.id).toList(),
      <String>['c'],
    );

    final groups = groupAgentsAssetsByDate(<AgentsAssetItem>[
      image,
      olderImage,
      audio,
      undated,
    ]);
    expect(
      groups.map((AgentsAssetGroup group) => group.dateKey).toList(),
      <String>['2026-11-02', '2026-11-01', agentsAssetUnknownDateKey],
    );
    expect(groups.first.items.length, 2);
  });
}
