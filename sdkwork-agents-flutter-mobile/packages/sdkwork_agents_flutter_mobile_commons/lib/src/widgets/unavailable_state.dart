import 'package:flutter/material.dart';

import '../theme/tech_blue_theme.dart';

/// Explicit "this client has no transport for the capability" state.
///
/// Data honesty is a contract requirement: a mobile root renders this block
/// instead of empty results or placeholder content when its injected source
/// reports [SdkworkAgentsCapabilityUnavailableException]. The retry affordance
/// is a real 48dp target and the block announces itself to assistive
/// technology.
class SdkworkAgentsUnavailableState extends StatelessWidget {
  const SdkworkAgentsUnavailableState({
    super.key,
    required this.headline,
    required this.hint,
    required this.retryLabel,
    this.onRetry,
  });

  final String headline;
  final String hint;
  final String retryLabel;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    final TechBlueThemeColors colors = techBlueThemeColors(context);
    return Center(
      child: Semantics(
        container: true,
        liveRegion: true,
        label: headline,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Container(
                width: 64,
                height: 64,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: scheme.surfaceContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.cloud_off_outlined,
                  size: 28,
                  color: colors.iconDefault,
                ),
              ),
              const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
              Text(
                headline,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: scheme.onSurface,
                ),
              ),
              const SizedBox(height: SdkworkAgentsFlutterTokens.spacingSm),
              Text(
                hint,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: scheme.onSurfaceVariant,
                ),
              ),
              if (onRetry != null) ...<Widget>[
                const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
                FilledButton.icon(
                  onPressed: onRetry,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(120, 48),
                  ),
                  icon: Icon(
                    Icons.refresh,
                    size: 18,
                    color: colors.iconOnPrimary,
                  ),
                  label: Text(retryLabel),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
