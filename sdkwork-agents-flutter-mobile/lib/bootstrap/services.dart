import 'dart:convert';

import 'package:sdkwork_agents_flutter_mobile_agents/sdkwork_agents_flutter_mobile_agents.dart';
import 'package:sdkwork_agents_flutter_mobile_assets/sdkwork_agents_flutter_mobile_assets.dart';
import 'package:sdkwork_agents_flutter_mobile_automation/sdkwork_agents_flutter_mobile_automation.dart';
import 'package:sdkwork_agents_flutter_mobile_canvas/sdkwork_agents_flutter_mobile_canvas.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_conversation/sdkwork_agents_flutter_mobile_conversation.dart';
import 'package:sdkwork_agents_flutter_mobile_creative/sdkwork_agents_flutter_mobile_creative.dart';
import 'package:sdkwork_agents_flutter_mobile_inspiration/sdkwork_agents_flutter_mobile_inspiration.dart';
import 'package:sdkwork_agents_flutter_mobile_library/sdkwork_agents_flutter_mobile_library.dart';
import 'package:sdkwork_agents_flutter_mobile_membership/sdkwork_agents_flutter_mobile_membership.dart';
import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';
import 'package:sdkwork_agents_flutter_mobile_projects/sdkwork_agents_flutter_mobile_projects.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../auth_session.dart';
import 'profile_identity.dart';
import 'sdk_clients.dart';
import 'settings_store.dart';

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
/// * assets' source             -> the Agents app API `/ai/assets` projection
/// * inspiration / creative / membership -> explicit unsupported adapters
///   until the Flutter SDK family exposes those transports (data honesty)
/// * profile identity           -> the authenticated application session
/// * settings store             -> shared_preferences
class AgentsMobileServices {
  const AgentsMobileServices({
    required this.catalog,
    required this.conversation,
    required this.library,
    required this.automation,
    required this.projects,
    required this.inspiration,
    required this.creative,
    required this.assets,
    required this.canvas,
    required this.membership,
    required this.profileIdentity,
    required this.settingsStore,
  });

  final AgentCatalogService catalog;
  final AgentsConversationService conversation;
  final AgentsLibraryService library;
  final AgentsAutomationService automation;
  final AgentsProjectsService projects;

  final AgentsInspirationSource inspiration;
  final AgentsCreativeSource creative;
  final AgentsAssetsSource assets;
  final AgentsCanvasSource canvas;
  final AgentsMembershipSource membership;
  final AgentsProfileIdentitySource profileIdentity;
  final AgentsSettingsStore settingsStore;
}

AgentsMobileServices createAgentsMobileServices(
  SdkClients clients, {
  String localeTag = sdkworkAgentsDefaultLocaleTag,
  AgentsSettingsStore? settingsStore,
}) {
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
    inspiration: createUnsupportedAgentsInspirationSource(),
    creative: createAgentsCreativeToolSource(client),
    assets: createAgentsAssetSdkSource(client),
    canvas: const _CanvasPreferencesSource(),
    membership: createUnsupportedAgentsMembershipSource(),
    profileIdentity: createAgentsSessionProfileIdentitySource(
      accessToken: () => AgentsAuthSession.accessToken,
      localeTag: localeTag,
    ),
    settingsStore:
        settingsStore ?? createSharedPreferencesAgentsSettingsStore(),
  );
}

/// Reads the browser-local canvas graph from device preferences.
///
/// The PC canvas persists the graph in browser storage; Flutter has a separate
/// store, so a workflow is shown only after a Flutter surface has written it.
class _CanvasPreferencesSource implements AgentsCanvasSource {
  const _CanvasPreferencesSource();

  static const String _storageKey = 'sdkwork_agents_canvas_workflow_v1';

  @override
  Future<AgentsCanvasWorkflow?> loadWorkflow() async {
    final preferences = await SharedPreferences.getInstance();
    final raw = preferences.getString(_storageKey);
    if (raw == null || raw.isEmpty) {
      return null;
    }
    return parseAgentsCanvasWorkflow(jsonDecode(raw));
  }
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
    return page.items
        .map((AgentsCatalogItem item) => item.id)
        .toList(growable: false);
  }
}
