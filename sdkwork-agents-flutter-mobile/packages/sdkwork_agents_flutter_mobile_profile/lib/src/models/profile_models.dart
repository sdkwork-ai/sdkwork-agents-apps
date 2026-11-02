/// Profile hub models for the Agents Flutter mobile surfaces.
library;

import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

/// Honest session summary shown at the top of the profile hub.
///
/// The Flutter app SDK has no IAM user-profile transport, so the identity is the
/// authenticated application session: a display name when the host supplied one
/// (for example a JWT `name` claim) and the application account context
/// otherwise. No invented person or avatar is shown.
class AgentsProfileIdentity {
  const AgentsProfileIdentity({
    required this.isAuthenticated,
    this.displayName,
    this.accountLabel,
    this.localeTag,
  });

  final bool isAuthenticated;
  final String? displayName;
  final String? accountLabel;
  final String? localeTag;
}

/// Compact account usage shown on the profile hub.
class AgentsProfileUsage {
  const AgentsProfileUsage({
    required this.turnCount,
    required this.inputTokens,
    required this.outputTokens,
  });

  final String turnCount;
  final String inputTokens;
  final String outputTokens;
}

/// One entry in the profile hub's link list.
///
/// The route id and physical route name come from the shell package so the hub
/// cannot drift from the navigation contract.
class AgentsProfileLink {
  const AgentsProfileLink({
    required this.routeId,
    required this.routeName,
    required this.labelKey,
    required this.icon,
  });

  final String routeId;
  final String routeName;
  final String labelKey;
  final IconData icon;
}

/// Contract order: membership, projects, library, automation, history,
/// settings (`specs/client-page-parity.spec.json` -> mobileProfileLinks).
const List<AgentsProfileLink> agentsProfileLinks = <AgentsProfileLink>[
  AgentsProfileLink(
    routeId: agentsMembershipCatalogRouteId,
    routeName: agentsMembershipRouteName,
    labelKey: 'agents.profile.link.membership',
    icon: Icons.workspace_premium_outlined,
  ),
  AgentsProfileLink(
    routeId: agentsProjectsListRouteId,
    routeName: agentsProjectsRouteName,
    labelKey: 'agents.profile.link.projects',
    icon: Icons.folder_outlined,
  ),
  AgentsProfileLink(
    routeId: agentsLibraryListRouteId,
    routeName: agentsLibraryRouteName,
    labelKey: 'agents.profile.link.library',
    icon: Icons.menu_book_outlined,
  ),
  AgentsProfileLink(
    routeId: agentsAutomationIndexRouteId,
    routeName: agentsAutomationRouteName,
    labelKey: 'agents.profile.link.automation',
    icon: Icons.schedule_outlined,
  ),
  AgentsProfileLink(
    routeId: agentsConversationListRouteId,
    routeName: agentsConversationHistoryRouteName,
    labelKey: 'agents.profile.link.history',
    icon: Icons.history,
  ),
  AgentsProfileLink(
    routeId: agentsSettingsIndexRouteId,
    routeName: agentsSettingsRouteName,
    labelKey: 'agents.profile.link.settings',
    icon: Icons.settings_outlined,
  ),
];
