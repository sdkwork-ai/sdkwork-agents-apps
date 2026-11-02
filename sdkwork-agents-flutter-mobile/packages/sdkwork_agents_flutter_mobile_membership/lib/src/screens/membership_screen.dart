import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/membership_models.dart';
import '../state/membership_state.dart';

/// Route-level membership catalog screen.
///
/// Shows the current membership summary, the published plan list, and the
/// checkout entry. With no membership transport the whole data surface renders
/// an explicit localized unavailable state with retry.
class AgentsMembershipScreen extends StatelessWidget {
  const AgentsMembershipScreen({
    super.key,
    required this.state,
    required this.plans,
    required this.onRefresh,
    required this.onRetry,
    required this.onCheckout,
    required this.onDismissCheckout,
    required this.onNavigateBack,
    required this.backTooltip,
    required this.translate,
  });

  final AgentsMembershipState state;
  final List<AgentsMembershipPlan> plans;
  final Future<void> Function() onRefresh;
  final VoidCallback onRetry;
  final ValueChanged<String> onCheckout;
  final VoidCallback onDismissCheckout;
  final VoidCallback onNavigateBack;
  final String backTooltip;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: <Widget>[
          SdkworkAgentsMobileAppBar(
            title: translate('agents.membership.title'),
            leading: Icons.arrow_back,
            leadingTooltip: backTooltip,
            onLeadingPressed: onNavigateBack,
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: onRefresh,
              child: _buildBody(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    if (state.loading) {
      return _scrollableCentered(const CircularProgressIndicator());
    }
    if (state.unavailable) {
      return _scrollableCentered(
        SdkworkAgentsUnavailableState(
          headline: translate('agents.membership.unavailable.title'),
          hint: translate('agents.membership.unavailable.hint'),
          retryLabel: translate('agents.membership.retry'),
          onRetry: onRetry,
        ),
      );
    }
    if (state.errorMessage.isNotEmpty) {
      return _scrollableCentered(
        SdkworkAgentsEmptyState(
          headline: state.errorMessage,
          glyph: '◈',
          onRetry: onRetry,
          retryLabel: translate('agents.membership.retry'),
        ),
      );
    }
    final overview = state.overview;
    if (overview == null) {
      return _scrollableCentered(
        SdkworkAgentsEmptyState(
          headline: translate('agents.membership.plans.empty'),
          glyph: '◈',
          onRetry: onRetry,
          retryLabel: translate('agents.membership.retry'),
        ),
      );
    }
    final checkoutUrl = state.checkoutUrl;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingLg,
      ),
      children: <Widget>[
        _MembershipSummaryCard(summary: overview.summary, translate: translate),
        if (checkoutUrl != null && checkoutUrl.isNotEmpty) ...<Widget>[
          const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
          _CheckoutLinkCard(
            url: checkoutUrl,
            onDismiss: onDismissCheckout,
            translate: translate,
          ),
        ],
        const SizedBox(height: SdkworkAgentsFlutterTokens.spacingLg),
        Text(
          translate('agents.membership.plans.title'),
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: scheme.onSurface,
          ),
        ),
        const SizedBox(height: 8),
        if (plans.isEmpty)
          SdkworkAgentsEmptyState(
            headline: translate('agents.membership.plans.empty'),
            glyph: '◈',
          )
        else
          for (final plan in plans)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _MembershipPlanCard(
                plan: plan,
                busy: state.checkoutPlanId == plan.id,
                onCheckout: () => onCheckout(plan.id),
                translate: translate,
              ),
            ),
      ],
    );
  }

  Widget _scrollableCentered(Widget child) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: <Widget>[
        SizedBox(height: 420, child: Center(child: child)),
      ],
    );
  }
}

class _MembershipSummaryCard extends StatelessWidget {
  const _MembershipSummaryCard(
      {required this.summary, required this.translate});

  final AgentsMembershipSummary summary;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    final expiresAt = summary.expiresAt;
    final ColorScheme scheme = Theme.of(context).colorScheme;
    final bool isDark = scheme.brightness == Brightness.dark;
    final Color cardColor = isDark ? scheme.primaryContainer : scheme.primary;
    final Color onCard = isDark ? scheme.onPrimaryContainer : scheme.onPrimary;
    return Card(
      color: cardColor,
      child: Padding(
        padding: const EdgeInsets.all(SdkworkAgentsFlutterTokens.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              translate('agents.membership.summary.title'),
              style: TextStyle(fontSize: 12, color: onCard),
            ),
            const SizedBox(height: 6),
            Text(
              summary.isMember
                  ? '${translate('agents.membership.summary.member')} · ${summary.tierName}'
                  : translate('agents.membership.summary.guest'),
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: onCard,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: <Widget>[
                Text(
                  '${translate('agents.membership.summary.points')}: ${summary.pointBalance}',
                  style: TextStyle(fontSize: 12, color: onCard),
                ),
                if (expiresAt != null && expiresAt.isNotEmpty) ...<Widget>[
                  const SizedBox(width: 16),
                  Text(
                    '${translate('agents.membership.summary.expiresAt')}: $expiresAt',
                    style: TextStyle(fontSize: 12, color: onCard),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MembershipPlanCard extends StatelessWidget {
  const _MembershipPlanCard({
    required this.plan,
    required this.busy,
    required this.onCheckout,
    required this.translate,
  });

  final AgentsMembershipPlan plan;
  final bool busy;
  final VoidCallback onCheckout;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(SdkworkAgentsFlutterTokens.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    plan.name,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: scheme.onSurface,
                    ),
                  ),
                ),
                if (plan.isRecommended)
                  Chip(
                    label:
                        Text(translate('agents.membership.plans.recommended')),
                    visualDensity: VisualDensity.compact,
                  ),
                if (plan.isCurrent)
                  Chip(
                    label: Text(translate('agents.membership.plans.current')),
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),
            if (plan.description.isNotEmpty) ...<Widget>[
              const SizedBox(height: 6),
              Text(
                plan.description,
                style: TextStyle(
                  fontSize: 12,
                  height: 1.4,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              '${plan.priceLabel} / ${plan.periodLabel}',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: scheme.primary,
              ),
            ),
            if (plan.features.isNotEmpty) ...<Widget>[
              const SizedBox(height: 8),
              for (final feature in plan.features)
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Icon(
                        Icons.check_circle_outline,
                        size: 14,
                        color: scheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          feature,
                          style: TextStyle(
                            fontSize: 12,
                            color: scheme.onSurface,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                onPressed: busy ? null : onCheckout,
                child: busy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Color(
                            SdkworkAgentsFlutterTokens.colorPrimaryOn,
                          ),
                        ),
                      )
                    : Text(translate('agents.membership.checkout')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CheckoutLinkCard extends StatelessWidget {
  const _CheckoutLinkCard({
    required this.url,
    required this.onDismiss,
    required this.translate,
  });

  final String url;
  final VoidCallback onDismiss;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).colorScheme.surfaceContainer,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              translate('agents.membership.checkoutReady'),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            SelectableText(url, style: const TextStyle(fontSize: 12)),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: onDismiss,
                style: TextButton.styleFrom(minimumSize: const Size(48, 48)),
                child: Text(translate('agents.membership.checkoutClose')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
