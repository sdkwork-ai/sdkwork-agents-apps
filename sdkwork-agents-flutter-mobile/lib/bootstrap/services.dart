import 'package:sdkwork_agents_flutter_mobile_agents/sdkwork_agents_flutter_mobile_agents.dart';
import 'package:sdkwork_agents_flutter_mobile_automation/sdkwork_agents_flutter_mobile_automation.dart';
import 'package:sdkwork_agents_flutter_mobile_conversation/sdkwork_agents_flutter_mobile_conversation.dart';
import 'package:sdkwork_agents_flutter_mobile_library/sdkwork_agents_flutter_mobile_library.dart';
import 'package:sdkwork_agents_flutter_mobile_projects/sdkwork_agents_flutter_mobile_projects.dart';

import 'sdk_clients.dart';

/// Composition root for the Agents Flutter mobile capability services.
///
/// This is the only place that knows which port implementation backs which
/// capability. Capability packages never import each other and never build an
/// SDK client (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 5 and 8),
/// so every cross-capability edge is wired here:
///
/// * conversation's agent port  -> agents' assistant provisioner
/// * automation's agent source  -> agents' catalog (self-scoped listing)
/// * library's file source      -> the Agents app API media-asset projection
class AgentsMobileServices {
  const AgentsMobileServices({
    required this.catalog,
    required this.conversation,
    required this.library,
    required this.automation,
    required this.projects,
  });

  final AgentCatalogService catalog;
  final AgentsConversationService conversation;
  final AgentsLibraryService library;
  final AgentsAutomationService automation;
  final AgentsProjectsService projects;
}

AgentsMobileServices createAgentsMobileServices(SdkClients clients) {
  final client = clients.agents;
  final provisioner = createAgentsAssistantProvisioner(client);
  final catalog = AgentCatalogService(client: client);

  late final AgentsConversationService conversation;
  conversation = createAgentsConversationService(
    client,
    _ProvisioningAgentPort(
      provisioner: provisioner,
      resolveDefaultModel: () => conversation.resolveDefaultModel(),
    ),
  );

  return AgentsMobileServices(
    catalog: catalog,
    conversation: conversation,
    library: createAgentsLibraryService(createAgentsAssetLibrarySource(client)),
    automation: createAgentsAutomationService(
      client,
      _ManagedAgentSource(catalog: catalog),
    ),
    projects: createAgentsProjectsService(client),
  );
}

/// Implements the conversation capability's agent port on top of the agents
/// capability's provisioner.
class _ProvisioningAgentPort implements AgentsConversationAgentPort {
  _ProvisioningAgentPort({
    required this.provisioner,
    required this.resolveDefaultModel,
  });

  final AgentsAssistantProvisioner provisioner;
  final Future<String> Function() resolveDefaultModel;

  @override
  Future<String> ensureAgent({String? model}) async {
    final resolved = model ?? await resolveDefaultModel();
    return provisioner.ensureBuiltInAssistant(resolved);
  }

  @override
  Future<void> updateAgentModel(String agentId, String model) {
    return provisioner.updateAssistantModel(agentId, model);
  }
}

/// Supplies the caller's own agent ids to the automation capability, which
/// scopes scheduled tasks per agent.
class _ManagedAgentSource implements AgentsAutomationAgentSource {
  _ManagedAgentSource({required this.catalog});

  final AgentCatalogService catalog;

  @override
  Future<List<String>> listManagedAgentIds(int limit) async {
    final page = await catalog.loadPage(
      page: 1,
      pageSize: limit,
      scope: AgentsCatalogScope.mine,
    );
    return page.items.map((AgentsCatalogItem item) => item.id).toList(growable: false);
  }
}
