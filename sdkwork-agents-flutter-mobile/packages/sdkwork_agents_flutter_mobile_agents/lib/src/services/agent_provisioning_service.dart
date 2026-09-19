/// Built-in assistant provisioning for the Agents Flutter mobile root.
///
/// Creating and updating agent records belongs to the agents capability, not to
/// the conversation surface (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section
/// 5). The conversation capability therefore consumes provisioning through an
/// injected port and this module supplies the SDK-backed implementation.
///
/// The request shapes mirror `sdkwork-agents-h5-agents` and
/// `sdkwork-agents-mp-agents` so the same record is produced regardless of which
/// client root provisions it first.
library;

import 'package:sdkwork_agents_app_sdk/sdkwork_agents_app_sdk.dart';
import 'package:sdkwork_agents_flutter_mobile_core/sdkwork_agents_flutter_mobile_core.dart';

/// Agent id of the built-in conversational assistant (shared by all roots).
const String agentsDefaultAssistantAgentId = 'agent.chat.default';

const String _defaultBindingId = 'binding.manifest.default';
const String _defaultProviderId = 'provider.agent.manifest';
const String _defaultConfigurationProfileId = 'profile.agent.manifest.default';
const List<String> _defaultProviderCapabilities = <String>['model.chat', 'tool.invoke'];

const String _assistantName = 'SDKWork Agents';
const String _assistantDescription = 'SDKWork Agents built-in conversational assistant.';
const String _assistantSystemPrompt =
    'You are SDKWork Agents. Provide accurate, concise, secure, and useful answers.';
const String _assistantWelcomeMessage = 'How can I help?';

class AgentsDefaultAssistantDraft {
  const AgentsDefaultAssistantDraft({
    required this.name,
    required this.description,
    required this.systemPrompt,
    required this.welcomeMessage,
    required this.model,
  });

  final String name;
  final String description;
  final String systemPrompt;
  final String welcomeMessage;
  final String model;
}

AgentsDefaultAssistantDraft createAgentsDefaultAssistantDraft(String model) {
  return AgentsDefaultAssistantDraft(
    name: _assistantName,
    description: _assistantDescription,
    systemPrompt: _assistantSystemPrompt,
    welcomeMessage: _assistantWelcomeMessage,
    model: model,
  );
}

/// Manifest accepted by `POST /ai/agents` for a built-in assistant.
Map<String, dynamic> buildAgentsDefaultAssistantManifest(
  AgentsDefaultAssistantDraft draft, {
  String agentId = agentsDefaultAssistantAgentId,
}) {
  return <String, dynamic>{
    'schema_version': '1.0.0',
    'manifest_type': 'agent',
    'agent_id': agentId,
    'name': agentId,
    'display_name': draft.name,
    'description': draft.systemPrompt,
    'version': '0.1.0',
    'domain': 'intelligence',
    'required_capabilities': <Map<String, dynamic>>[
      <String, dynamic>{'capability_id': 'model.chat'},
    ],
    'optional_capabilities': <Map<String, dynamic>>[
      <String, dynamic>{'capability_id': 'tool.invoke'},
      <String, dynamic>{'capability_id': 'knowledge.read'},
      <String, dynamic>{'capability_id': 'memory.query'},
    ],
    'event_families': <String>['agent.lifecycle'],
    'owner': <String, dynamic>{'name': 'sdkwork-agents-flutter-mobile'},
    'status': 'active',
  };
}

/// `true` when [error] is the generated SDK's HTTP 404.
///
/// The Dart transport raises a plain `Exception('HTTP <status>: <body>')` rather
/// than a typed problem object, so the status can only be read off the message.
/// Keep this narrow: a false positive would skip provisioning entirely.
bool isAgentsNotFoundError(Object error) {
  return error.toString().contains('HTTP 404');
}

abstract class AgentsAssistantProvisioner {
  /// Returns the built-in assistant id, creating the record when absent.
  Future<String> ensureBuiltInAssistant(String model);

  /// Syncs the assistant model. Requires `ai.agents.manage`.
  Future<void> updateAssistantModel(String agentId, String model);

  /// Creates the default provider binding after publish (`ai.agents.manage`).
  Future<void> publishAssistant(String agentId);
}

AgentsAssistantProvisioner createAgentsAssistantProvisioner(SdkworkAppClient client) {
  return _AgentsAssistantProvisionerImpl(client: client);
}

class _AgentsAssistantProvisionerImpl implements AgentsAssistantProvisioner {
  _AgentsAssistantProvisionerImpl({required this.client});

  final SdkworkAppClient client;

  @override
  Future<String> ensureBuiltInAssistant(String model) async {
    try {
      final existing = await client.ai.agentsRetrieve(agentsDefaultAssistantAgentId);
      final record = sdkworkAgentsResourceItem(existing?.data);
      final agentId = record?['agentId']?.toString();
      return agentId == null || agentId.isEmpty ? agentsDefaultAssistantAgentId : agentId;
    } catch (error) {
      if (!isAgentsNotFoundError(error)) {
        rethrow;
      }
    }
    final draft = createAgentsDefaultAssistantDraft(model);
    final created = await client.ai.agentsCreate(
      CreateAgentRequest(
        agentId: agentsDefaultAssistantAgentId,
        code: agentsDefaultAssistantAgentId,
        displayName: draft.name,
        description: draft.description,
        manifest: buildAgentsDefaultAssistantManifest(draft),
        managementProfile: AgentManagementProfile(
          type: 'normal',
          model: draft.model,
          systemPrompt: draft.systemPrompt,
          welcomeMessage: draft.welcomeMessage,
        ),
        implementationKind: 'manifest-only',
        visibility: 'private',
        tags: const <String>[],
        requestedAt: DateTime.now().toUtc().toIso8601String(),
      ),
    );
    final record = sdkworkAgentsResourceItem(created?.data);
    final agentId = record?['agentId']?.toString();
    return agentId == null || agentId.isEmpty ? agentsDefaultAssistantAgentId : agentId;
  }

  @override
  Future<void> updateAssistantModel(String agentId, String model) async {
    final current = await client.ai.agentsRetrieve(agentId);
    final record = sdkworkAgentsResourceItem(current?.data);
    final version = record?['version']?.toString();
    final draft = createAgentsDefaultAssistantDraft(model);
    await client.ai.agentsUpdate(
      agentId,
      UpdateAgentRequest(
        displayName: draft.name,
        description: draft.description,
        manifest: buildAgentsDefaultAssistantManifest(draft, agentId: agentId),
        managementProfile: AgentManagementProfile(
          type: 'normal',
          model: model,
          systemPrompt: draft.systemPrompt,
          welcomeMessage: draft.welcomeMessage,
        ),
        expectedVersion: version,
        requestedAt: DateTime.now().toUtc().toIso8601String(),
      ),
    );
  }

  @override
  Future<void> publishAssistant(String agentId) async {
    try {
      await client.ai.agentsProviderBindingsCreate(
        agentId,
        CreateAgentProviderBindingRequest(
          bindingId: _defaultBindingId,
          providerId: _defaultProviderId,
          implementationKind: 'manifest-only',
          configurationProfileId: _defaultConfigurationProfileId,
          capabilities: _defaultProviderCapabilities,
          makeDefault: true,
          requestedAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );
    } catch (error) {
      final message = error.toString();
      if (!message.contains(_defaultBindingId) && !message.contains('already exists')) {
        rethrow;
      }
    }
  }
}
