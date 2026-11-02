import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';

class _IdentitySource implements AgentsProfileIdentitySource {
  const _IdentitySource();

  @override
  Future<AgentsProfileIdentity> load() async {
    return const AgentsProfileIdentity(
      isAuthenticated: true,
      displayName: 'Tester',
      accountLabel: 'SDKWork Agents',
    );
  }
}

void main() {
  test('profile loads account usage from the injected loader', () async {
    final controller = AgentsProfileController(
      source: const _IdentitySource(),
      loadUsage: () async => const AgentsProfileUsage(
        turnCount: '12',
        inputTokens: '1000',
        outputTokens: '250',
      ),
      localeTag: 'en-US',
    );

    await controller.load();

    expect(controller.state.identity?.displayName, 'Tester');
    expect(controller.state.usage?.turnCount, '12');
    expect(formatProfileTokenTotal(controller.state.usage!), '1250');
  });

  test('profile keeps identity when usage loading fails', () async {
    final controller = AgentsProfileController(
      source: const _IdentitySource(),
      loadUsage: () async => throw StateError('usage offline'),
      localeTag: 'en-US',
    );

    await controller.load();

    expect(controller.state.identity?.isAuthenticated, isTrue);
    expect(controller.state.usage, isNull);
    expect(controller.state.errorMessage, isEmpty);
  });
}
