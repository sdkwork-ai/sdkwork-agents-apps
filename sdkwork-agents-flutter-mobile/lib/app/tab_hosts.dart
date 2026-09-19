/// Screen hosts for the five mobile tabs.
///
/// Each host owns exactly one controller (created from the bootstrap-injected
/// services), loads once when mounted, and rebuilds its screen through an
/// `AnimatedBuilder`. Hosts live in the root because the root is the only layer
/// allowed to know every capability at once
/// (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 5).
library;

import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_agents/sdkwork_agents_flutter_mobile_agents.dart';
import 'package:sdkwork_agents_flutter_mobile_automation/sdkwork_agents_flutter_mobile_automation.dart';
import 'package:sdkwork_agents_flutter_mobile_conversation/sdkwork_agents_flutter_mobile_conversation.dart';
import 'package:sdkwork_agents_flutter_mobile_library/sdkwork_agents_flutter_mobile_library.dart';
import 'package:sdkwork_agents_flutter_mobile_projects/sdkwork_agents_flutter_mobile_projects.dart';

import '../bootstrap/runtime.dart';

/// Hosts a controller-backed screen and ties the controller's lifecycle to the
/// tab that owns it.
class _ControllerTabHost<C extends ChangeNotifier> extends StatefulWidget {
  const _ControllerTabHost({
    required this.create,
    required this.load,
    required this.build,
  });

  final C Function() create;
  final Future<void> Function(C controller) load;
  final Widget Function(C controller) build;

  @override
  State<_ControllerTabHost<C>> createState() => _ControllerTabHostState<C>();
}

class _ControllerTabHostState<C extends ChangeNotifier>
    extends State<_ControllerTabHost<C>> {
  late final C _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.create();
    // Load after the first frame so a failing request surfaces through the
    // controller's own error state instead of during build.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        widget.load(_controller);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (BuildContext context, _) => widget.build(_controller),
    );
  }
}

/// Tasks tab: streaming conversation with session management.
class AgentsConversationTab extends StatelessWidget {
  const AgentsConversationTab({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return _ControllerTabHost<AgentsConversationController>(
      create: () => AgentsConversationController(
        service: runtime.services.conversation,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsConversationController controller) => controller.loadSessions(),
      build: (AgentsConversationController controller) => AgentsConversationChatScreen(
        state: controller.state,
        onSend: controller.sendTurn,
        onNewSession: controller.startNewSession,
        onOpenHistory: () => _openHistory(context, controller),
        translate: controller.translate,
      ),
    );
  }

  Future<void> _openHistory(
    BuildContext context,
    AgentsConversationController controller,
  ) {
    return Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (BuildContext routeContext) => AnimatedBuilder(
          animation: controller,
          builder: (BuildContext context, _) => AgentsConversationHistoryScreen(
            state: controller.state,
            onSelect: (AgentsConversationSession session) async {
              await controller.openSession(session);
              if (routeContext.mounted) {
                Navigator.of(routeContext).pop();
              }
            },
            onRename: controller.renameSession,
            onDelete: controller.deleteSession,
            translate: controller.translate,
            onClose: () => Navigator.of(routeContext).pop(),
          ),
        ),
      ),
    );
  }
}

/// Experts tab: the agents catalog with its own/market scope switch.
class AgentsCatalogTab extends StatelessWidget {
  const AgentsCatalogTab({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return _ControllerTabHost<AgentsCatalogController>(
      create: () => AgentsCatalogController(
        service: runtime.services.catalog,
        localeTag: runtime.localeTag,
      ),
      load: (AgentsCatalogController controller) => controller.load(),
      build: (AgentsCatalogController controller) => AgentsCatalogScreen(
        state: controller.state,
        onScopeChanged: (AgentsCatalogScope scope) => controller.load(scope: scope),
        onQueryChanged: controller.updateQuery,
        onRefresh: () => controller.load(),
        onLoadMore: controller.loadMore,
        translate: controller.translate,
      ),
    );
  }
}

/// Library tab.
class AgentsLibraryTab extends StatelessWidget {
  const AgentsLibraryTab({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return _ControllerTabHost<AgentsLibraryController>(
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
        onOpen: (AgentsLibraryFile file) {
          _reportResolvedUrl(context, controller, file);
        },
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

/// Automation tab.
class AgentsAutomationTab extends StatelessWidget {
  const AgentsAutomationTab({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return _ControllerTabHost<AgentsAutomationController>(
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
      ),
    );
  }
}

/// Projects tab.
class AgentsProjectsTab extends StatelessWidget {
  const AgentsProjectsTab({required this.runtime, super.key});

  final AgentsMobileRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return _ControllerTabHost<AgentsProjectsController>(
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
      ),
    );
  }
}
