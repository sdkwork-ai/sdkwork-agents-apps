import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/profile_models.dart';
import '../state/profile_state.dart';

/// Route-level profile hub.
///
/// Shows an honest session summary plus the six contract links: membership,
/// projects, library, automation, chat history, and settings.
class AgentsProfileScreen extends StatelessWidget {
  const AgentsProfileScreen({
    super.key,
    required this.state,
    required this.onOpenLink,
    required this.onRetry,
    required this.onNavigateBack,
    required this.backTooltip,
    required this.translate,
  });

  final AgentsProfileState state;
  final ValueChanged<AgentsProfileLink> onOpenLink;
  final Future<void> Function() onRetry;
  final VoidCallback onNavigateBack;
  final String backTooltip;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: <Widget>[
          SdkworkAgentsMobileAppBar(
            title: translate('agents.profile.title'),
            leading: Icons.arrow_back,
            leadingTooltip: backTooltip,
            onLeadingPressed: onNavigateBack,
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: onRetry,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(
                  SdkworkAgentsFlutterTokens.spacingMd,
                  SdkworkAgentsFlutterTokens.spacingMd,
                  SdkworkAgentsFlutterTokens.spacingMd,
                  SdkworkAgentsFlutterTokens.spacingLg,
                ),
                children: <Widget>[
                  _ProfileSummaryCard(
                    state: state,
                    onRetry: onRetry,
                    translate: translate,
                  ),
                  const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
                  _ProfileUsageCard(
                    usage: state.usage,
                    translate: translate,
                  ),
                  const SizedBox(height: SdkworkAgentsFlutterTokens.spacingLg),
                  Text(
                    translate('agents.profile.links.title'),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Card(
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: <Widget>[
                        for (final link in agentsProfileLinks)
                          _ProfileLinkTile(
                            link: link,
                            translate: translate,
                            onTap: () => onOpenLink(link),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileSummaryCard extends StatelessWidget {
  const _ProfileSummaryCard({
    required this.state,
    required this.onRetry,
    required this.translate,
  });

  final AgentsProfileState state;
  final Future<void> Function() onRetry;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    final identity = state.identity;
    final authenticated = identity?.isAuthenticated ?? false;
    final displayName = identity?.displayName;
    final title = displayName != null && displayName.isNotEmpty
        ? displayName
        : authenticated
            ? translate('agents.profile.signedInTitle')
            : translate('agents.profile.signedOutTitle');
    final hint = authenticated
        ? translate('agents.profile.signedInHint')
        : translate('agents.profile.signedOutHint');
    final ColorScheme scheme = Theme.of(context).colorScheme;
    final TechBlueThemeColors colors = techBlueThemeColors(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(SdkworkAgentsFlutterTokens.spacingMd),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            CircleAvatar(
              radius: 28,
              backgroundColor: scheme.surfaceContainerHighest,
              child: Icon(
                Icons.person_outline,
                size: 28,
                color: colors.iconDefault,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      color: scheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hint,
                    style: TextStyle(
                      fontSize: 12,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  if (state.loading) ...<Widget>[
                    const SizedBox(height: 8),
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ],
                  if (state.errorMessage.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 6),
                    Text(
                      state.errorMessage,
                      style: TextStyle(
                        fontSize: 12,
                        color: colors.dangerText,
                      ),
                    ),
                    const SizedBox(height: 4),
                    TextButton(
                      onPressed: onRetry,
                      style: TextButton.styleFrom(
                        minimumSize: const Size(48, 48),
                        padding: EdgeInsets.zero,
                      ),
                      child: Text(translate('agents.profile.retry')),
                    ),
                  ],
                  if (identity?.localeTag != null &&
                      identity!.localeTag!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        '${translate('agents.profile.localeLabel')}: ${identity.localeTag}',
                        style: TextStyle(
                          fontSize: 11,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileUsageCard extends StatelessWidget {
  const _ProfileUsageCard({required this.usage, required this.translate});

  final AgentsProfileUsage? usage;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    final value = usage;
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(SdkworkAgentsFlutterTokens.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              translate('agents.profile.usage.title'),
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: scheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 6),
            if (value == null)
              Text(
                translate('agents.profile.usage.unavailable'),
                style: TextStyle(
                  fontSize: 12,
                  color: scheme.onSurfaceVariant,
                ),
              )
            else ...<Widget>[
              Text(
                translate('agents.profile.usage.turns').replaceAll(
                    '{{count}}', formatProfileUsageCount(value.turnCount)),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: scheme.onSurface,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                translate('agents.profile.usage.tokens').replaceAll(
                  '{{count}}',
                  formatProfileTokenTotal(value),
                ),
                style: TextStyle(
                  fontSize: 12,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

String formatProfileUsageCount(String value) {
  final parsed = BigInt.tryParse(value);
  return parsed == null ? value : parsed.toString();
}

String formatProfileTokenTotal(AgentsProfileUsage usage) {
  final input = BigInt.tryParse(usage.inputTokens) ?? BigInt.zero;
  final output = BigInt.tryParse(usage.outputTokens) ?? BigInt.zero;
  return (input + output).toString();
}

class _ProfileLinkTile extends StatelessWidget {
  const _ProfileLinkTile({
    required this.link,
    required this.translate,
    required this.onTap,
  });

  final AgentsProfileLink link;
  final String Function(String key) translate;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final label = translate(link.labelKey);
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: label,
      child: ListTile(
        minVerticalPadding: 12,
        leading: Icon(link.icon, color: scheme.onSurfaceVariant),
        title: Text(label),
        trailing: Icon(
          Icons.chevron_right,
          size: 20,
          color: scheme.onSurfaceVariant,
        ),
        onTap: onTap,
      ),
    );
  }
}
