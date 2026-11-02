/// Account usage adapter for the Agents Flutter profile hub.
library;

import 'package:sdkwork_agents_app_sdk/sdkwork_agents_app_sdk.dart';
import 'package:sdkwork_agents_flutter_mobile_core/sdkwork_agents_flutter_mobile_core.dart';
import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';

/// Reads `agents.usage.summary` through the generated app SDK.
Future<AgentsProfileUsage?> loadAgentsProfileUsage(
  SdkworkAppClient client,
) async {
  try {
    final response = await client.ai.agentsUsageSummaryRetrieve();
    final data = sdkworkAgentsAsMap(response?.data);
    if (data == null) {
      return null;
    }
    return AgentsProfileUsage(
      turnCount: data['turnCount']?.toString() ?? '0',
      inputTokens: data['inputTokens']?.toString() ?? '0',
      outputTokens: data['outputTokens']?.toString() ?? '0',
    );
  } catch (_) {
    return null;
  }
}
