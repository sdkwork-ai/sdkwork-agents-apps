import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_agents_flutter_mobile_assets/sdkwork_agents_flutter_mobile_assets.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_creative/sdkwork_agents_flutter_mobile_creative.dart';
import 'package:sdkwork_agents_flutter_mobile_inspiration/sdkwork_agents_flutter_mobile_inspiration.dart';
import 'package:sdkwork_agents_flutter_mobile_membership/sdkwork_agents_flutter_mobile_membership.dart';

/// A capability with no Flutter transport must surface an explicit unavailable
/// state, never fabricated rows.
void main() {
  test('inspiration reports unavailable without inventing a feed', () async {
    final controller = AgentsInspirationController(
      source: createUnsupportedAgentsInspirationSource(),
      localeTag: 'en-US',
    );
    await controller.load();
    expect(controller.state.unavailable, isTrue);
    expect(controller.state.items, isEmpty);
    expect(controller.state.loading, isFalse);
    expect(controller.state.errorMessage, isNotEmpty);
  });

  test('creative reports unavailable and keeps the form usable', () async {
    final controller = AgentsCreativeController(
      source: createUnsupportedAgentsCreativeSource(),
      localeTag: 'en-US',
    );
    await controller.loadSessions();
    expect(controller.state.unavailable, isTrue);
    expect(controller.state.sessions, isEmpty);
    controller.updatePrompt('a poster');
    controller.selectModality(AgentsCreativeModality.video);
    expect(controller.state.modality, AgentsCreativeModality.video);
    await controller.submit();
    expect(controller.state.unavailable, isTrue);
    expect(controller.state.submitting, isFalse);
  });

  test('membership reports unavailable without inventing plans', () async {
    final controller = AgentsMembershipController(
      source: createUnsupportedAgentsMembershipSource(),
      localeTag: 'en-US',
    );
    await controller.load();
    expect(controller.state.unavailable, isTrue);
    expect(controller.plans, isEmpty);
    expect(controller.state.overview, isNull);
  });

  test('assets maps an unavailable source onto the explicit state', () async {
    final controller = AgentsAssetsController(
      source: const _UnavailableAssetsSource(),
      localeTag: 'en-US',
    );
    await controller.load();
    expect(controller.state.unavailable, isTrue);
    expect(controller.state.items, isEmpty);
    expect(controller.groups, isEmpty);
  });
}

class _UnavailableAssetsSource implements AgentsAssetsSource {
  const _UnavailableAssetsSource();

  @override
  Future<List<AgentsAssetItem>> listAssets() {
    throw const SdkworkAgentsCapabilityUnavailableException('assets');
  }
}
