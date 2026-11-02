import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_agents/sdkwork_agents_flutter_mobile_agents.dart';
import 'package:sdkwork_agents_flutter_mobile_assets/sdkwork_agents_flutter_mobile_assets.dart';
import 'package:sdkwork_agents_flutter_mobile_automation/sdkwork_agents_flutter_mobile_automation.dart';
import 'package:sdkwork_agents_flutter_mobile_canvas/sdkwork_agents_flutter_mobile_canvas.dart';
import 'package:sdkwork_agents_flutter_mobile_conversation/sdkwork_agents_flutter_mobile_conversation.dart';
import 'package:sdkwork_agents_flutter_mobile_library/sdkwork_agents_flutter_mobile_library.dart';
import 'package:sdkwork_agents_flutter_mobile_membership/sdkwork_agents_flutter_mobile_membership.dart';
import 'package:sdkwork_agents_flutter_mobile_profile/sdkwork_agents_flutter_mobile_profile.dart';
import 'package:sdkwork_agents_flutter_mobile_projects/sdkwork_agents_flutter_mobile_projects.dart';

import '../bootstrap/profile_usage.dart';
import '../bootstrap/runtime.dart';
import 'app_routes.dart';
import 'controller_host.dart';
import 'theme_controller.dart';

/// Pushed pages behind the profile hub and the secondary routes.
///
/// These live in the root for the same reason the tab hosts do: only the
/// composition root may know every capability
/// (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 5).
class AgentsProfilePage extends StatelessWidget {
  const AgentsProfilePage({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsProfileController>(
      create: () => AgentsProfileController(
        source: runtime.services.profileIdentity,
        loadUsage: () => loadAgentsProfileUsage(runtime.sdkClients.agents),
        localeTag: runtime.localeTag,
      ),
      load: (AgentsProfileController controller) => controller.load(),
      build: (AgentsProfileController controller) => AgentsProfileScreen(
        state: controller.state,
        onOpenLink: (AgentsProfileLink link) =>
            openAgentsStackRoute(context, link.routeName),
        onRetry: controller.load,
        onNavigateBack: () => Navigator.of(context).pop(),
        backTooltip: agentsBackTooltip(runtime),
        translate: controller.translate,
      ),
    );
  }
}

class AgentsSettingsPage extends StatelessWidget {
  const AgentsSettingsPage({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsSettingsController>(
      create: () => AgentsSettingsController(
        store: runtime.services.settingsStore,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsSettingsController controller) => controller.load(),
      build: (AgentsSettingsController controller) => AgentsSettingsScreen(
        state: controller.state,
        onLanguageChanged: controller.updateLanguage,
        onThemeChanged: (AgentsSettingsTheme theme) {
          controller.updateTheme(theme);
          AgentsThemeScope.of(context).setSettingsTheme(theme);
        },
        onNotificationsChanged: controller.updateNotifications,
        onAutoplayChanged: controller.updateAutoplay,
        onSave: controller.save,
        onRetry: controller.load,
        onNavigateBack: () => Navigator.of(context).pop(),
        backTooltip: agentsBackTooltip(runtime),
        translate: controller.translate,
      ),
    );
  }
}

class AgentsMembershipPage extends StatelessWidget {
  const AgentsMembershipPage({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsMembershipController>(
      create: () => AgentsMembershipController(
        source: runtime.services.membership,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsMembershipController controller) => controller.load(),
      build: (AgentsMembershipController controller) => AgentsMembershipScreen(
        state: controller.state,
        plans: controller.plans,
        onRefresh: controller.load,
        onRetry: controller.load,
        onCheckout: controller.checkout,
        onDismissCheckout: controller.dismissCheckout,
        onNavigateBack: () => Navigator.of(context).pop(),
        backTooltip: agentsBackTooltip(runtime),
        translate: controller.translate,
      ),
    );
  }
}

class AgentsProjectsPage extends StatelessWidget {
  const AgentsProjectsPage({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsProjectsController>(
      create: () => AgentsProjectsController(
        service: runtime.services.projects,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsProjectsController controller) => controller.load(),
      build: (AgentsProjectsController controller) => AgentsProjectsScreen(
        state: controller.state,
        projects: controller.visibleProjects,
        onQueryChanged: controller.updateQuery,
        onRefresh: controller.load,
        translate: controller.translate,
        onNavigateBack: () => Navigator.of(context).pop(),
        backTooltip: agentsBackTooltip(runtime),
      ),
    );
  }
}

class AgentsLibraryPage extends StatelessWidget {
  const AgentsLibraryPage({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsLibraryController>(
      create: () => AgentsLibraryController(
        service: runtime.services.library,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsLibraryController controller) => controller.load(),
      build: (AgentsLibraryController controller) => AgentsLibraryScreen(
        state: controller.state,
        files: controller.visibleFiles,
        onQueryChanged: controller.updateQuery,
        onRefresh: controller.load,
        translate: controller.translate,
        onOpen: (AgentsLibraryFile file) =>
            _reportResolvedUrl(context, controller, file),
        onNavigateBack: () => Navigator.of(context).pop(),
        backTooltip: agentsBackTooltip(runtime),
      ),
    );
  }

  /// The runtime ships no URL launcher, so a resolved entry is surfaced to the
  /// user instead of being opened silently.
  Future<void> _reportResolvedUrl(
    BuildContext context,
    AgentsLibraryController controller,
    AgentsLibraryFile file,
  ) async {
    final url = await controller.resolveOpenUrl(file.id);
    if (!context.mounted) {
      return;
    }
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text(
          url ?? controller.translate('agents.library.openFailed'),
          maxLines: 3,
        ),
      ),
    );
  }
}

class AgentsAutomationPage extends StatelessWidget {
  const AgentsAutomationPage({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsAutomationController>(
      create: () => AgentsAutomationController(
        service: runtime.services.automation,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsAutomationController controller) => controller.load(),
      build: (AgentsAutomationController controller) => AgentsAutomationScreen(
        state: controller.state,
        tasks: controller.visibleTasks,
        onQueryChanged: controller.updateQuery,
        onRefresh: () => controller.load(force: true),
        statusLabel: controller.statusLabel,
        translate: controller.translate,
        onNavigateBack: () => Navigator.of(context).pop(),
        backTooltip: agentsBackTooltip(runtime),
      ),
    );
  }
}

class AgentsAssetDetailPage extends StatelessWidget {
  const AgentsAssetDetailPage({required this.runtime, this.item, super.key});

  final AgentsMobileRuntime runtime;
  final AgentsAssetItem? item;

  @override
  Widget build(BuildContext context) {
    return AgentsAssetDetailScreen(
      item: item,
      translate: createAgentsAssetsTranslator(runtime.localeTag),
      onBack: () => Navigator.of(context).pop(),
    );
  }
}

class AgentsEditorPage extends StatelessWidget {
  const AgentsEditorPage({required this.runtime, this.initialItem, super.key});

  final AgentsMobileRuntime runtime;
  final AgentsCatalogItem? initialItem;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsEditorController>(
      create: () => AgentsEditorController(
        service: runtime.services.catalog,
        initialItem: initialItem,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsEditorController controller) => controller.load(),
      build: (AgentsEditorController controller) => AgentsEditorScreen(
        state: controller.state,
        onNameChanged: controller.updateName,
        onDescriptionChanged: controller.updateDescription,
        onSave: controller.save,
        onRetry: controller.load,
        translate: controller.translate,
        onNavigateBack: () => Navigator.of(context).pop(),
        backTooltip: agentsBackTooltip(runtime),
      ),
    );
  }
}

class AgentsCanvasPage extends StatelessWidget {
  const AgentsCanvasPage({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AgentsControllerHost<AgentsCanvasController>(
      create: () => AgentsCanvasController(
        source: runtime.services.canvas,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsCanvasController controller) => controller.load(),
      build: (AgentsCanvasController controller) => AgentsCanvasScreen(
        state: controller.state,
        connectionsLabel: controller.connectionsLabel,
        onRefresh: controller.load,
        onRetry: controller.load,
        translate: controller.translate,
        onNavigateBack: () => Navigator.of(context).pop(),
        backTooltip: agentsBackTooltip(runtime),
      ),
    );
  }
}

class AgentsConversationHistoryPage extends StatelessWidget {
  const AgentsConversationHistoryPage({required this.runtime, super.key});

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
          AgentsConversationHistoryScreen(
            state: controller.state,
            onSelect: (AgentsConversationSession session) async {
              await controller.openSession(session);
              if (context.mounted) {
                Navigator.of(context).pop();
              }
            },
            onRename: controller.renameSession,
            onDelete: controller.deleteSession,
            translate: controller.translate,
            onClose: () => Navigator.of(context).pop(),
          ),
    );
  }
}
