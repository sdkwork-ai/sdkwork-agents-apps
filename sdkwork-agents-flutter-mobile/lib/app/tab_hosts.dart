import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_agents/sdkwork_agents_flutter_mobile_agents.dart';
import 'package:sdkwork_agents_flutter_mobile_assets/sdkwork_agents_flutter_mobile_assets.dart';
import 'package:sdkwork_agents_flutter_mobile_conversation/sdkwork_agents_flutter_mobile_conversation.dart';
import 'package:sdkwork_agents_flutter_mobile_creative/sdkwork_agents_flutter_mobile_creative.dart';
import 'package:sdkwork_agents_flutter_mobile_inspiration/sdkwork_agents_flutter_mobile_inspiration.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

import '../bootstrap/runtime.dart';
import 'app_routes.dart';
import 'controller_host.dart';

/// Screen hosts for the five bottom tabs.
///
/// Hosts live in the root because the root is the only layer allowed to know
/// every capability at once (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md`
/// section 5). Each host owns one controller and passes the accessible profile
/// action every tab is required to expose.
class AgentsConversationTab extends StatelessWidget {
  const AgentsConversationTab({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsConversationController>(
      create: () => AgentsConversationController(
        service: runtime.services.conversation,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsConversationController controller) =>
          controller.loadSessions(),
      build: (AgentsConversationController controller) =>
          AgentsConversationChatScreen(
            state: controller.state,
            onSend: controller.sendTurn,
            onNewSession: controller.startNewSession,
            onOpenHistory: () => openAgentsStackRoute(
              context,
              agentsConversationHistoryRouteName,
            ),
            translate: controller.translate,
            profileAction: buildAgentsProfileAction(context, runtime),
          ),
    );
  }
}

/// Inspiration tab: 发现/精选 feed with pull-to-refresh.
class AgentsInspirationTab extends StatelessWidget {
  const AgentsInspirationTab({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsInspirationController>(
      create: () => AgentsInspirationController(
        source: runtime.services.inspiration,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsInspirationController controller) => controller.load(),
      build: (AgentsInspirationController controller) =>
          AgentsInspirationScreen(
            state: controller.state,
            items: controller.state.items,
            onChannelChanged: controller.selectChannel,
            onRefresh: controller.load,
            onRetry: controller.load,
            translate: controller.translate,
            profileAction: buildAgentsProfileAction(context, runtime),
          ),
    );
  }
}

/// Creative studio tab: prompt form, sessions, results.
class AgentsCreativeTab extends StatelessWidget {
  const AgentsCreativeTab({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsCreativeController>(
      create: () => AgentsCreativeController(
        source: runtime.services.creative,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsCreativeController controller) => controller.loadSessions(),
      build: (AgentsCreativeController controller) => AgentsCreativeScreen(
        state: controller.state,
        sessions: controller.state.sessions,
        onPromptChanged: controller.updatePrompt,
        onModalityChanged: controller.selectModality,
        onAspectChanged: controller.selectAspectRatio,
        onSubmit: controller.submit,
        onSelectSession: controller.selectSession,
        onRetry: controller.retry,
        translate: controller.translate,
        profileAction: buildAgentsProfileAction(context, runtime),
        canvasAction: buildAgentsCanvasAction(context, runtime),
      ),
    );
  }
}

/// Assets tab: date-grouped grid with kind filter.
class AgentsAssetsTab extends StatelessWidget {
  const AgentsAssetsTab({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsAssetsController>(
      create: () => AgentsAssetsController(
        source: runtime.services.assets,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsAssetsController controller) => controller.load(),
      build: (AgentsAssetsController controller) => AgentsAssetsScreen(
        state: controller.state,
        groups: controller.groups,
        groupLabel: controller.groupLabel,
        onKindChanged: controller.selectKind,
        onRefresh: controller.load,
        onRetry: controller.load,
        translate: controller.translate,
        profileAction: buildAgentsProfileAction(context, runtime),
      ),
    );
  }
}

/// Agent catalog tab with its own/market scope switch.
class AgentsCatalogTab extends StatelessWidget {
  const AgentsCatalogTab({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsCatalogController>(
      create: () => AgentsCatalogController(
        service: runtime.services.catalog,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsCatalogController controller) => controller.load(),
      build: (AgentsCatalogController controller) => AgentsCatalogScreen(
        state: controller.state,
        onScopeChanged: (AgentsCatalogScope scope) =>
            controller.load(scope: scope),
        onQueryChanged: controller.updateQuery,
        onRefresh: () => controller.load(),
        onLoadMore: controller.loadMore,
        translate: controller.translate,
        profileAction: buildAgentsProfileAction(context, runtime),
        onOpenAgent: (AgentsCatalogItem item) => openAgentsStackRoute(
          context,
          agentsCatalogEditorRouteName,
          arguments: item,
        ),
      ),
    );
  }
}
