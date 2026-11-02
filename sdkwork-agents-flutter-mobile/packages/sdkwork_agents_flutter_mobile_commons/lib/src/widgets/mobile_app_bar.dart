import 'package:flutter/material.dart';

import '../theme/tech_blue_theme.dart';

/// Mobile app bar shared by the Agents Flutter capability screens.
///
/// Matches the mobile design language used on the H5 root: a compact flat bar
/// on the page background, a leading round affordance, a title with an optional
/// second line (the active task or expert), and trailing actions
/// (`APP_FLUTTER_UI_SPEC.md` — capability packages own their screen chrome).
/// There is no bottom border and no elevation (`specs/client-theme.spec.json`).
class SdkworkAgentsMobileAppBar extends StatelessWidget {
  const SdkworkAgentsMobileAppBar({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.leadingTooltip,
    this.actions = const <Widget>[],
    this.onLeadingPressed,
  });

  final String title;
  final String? subtitle;

  /// Leading glyph. When null no leading affordance is rendered, so a tab does
  /// not expose a dead menu button.
  final IconData? leading;
  final String? leadingTooltip;
  final List<Widget> actions;
  final VoidCallback? onLeadingPressed;

  @override
  Widget build(BuildContext context) {
    final subtitleText = subtitle;
    final leadingIcon = leading;
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return Material(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: SafeArea(
        bottom: false,
        child: SizedBox(
          height: 56,
          child: Row(
            children: <Widget>[
              const SizedBox(width: SdkworkAgentsFlutterTokens.spacingSm),
              if (leadingIcon != null)
                _RoundIconButton(
                  icon: leadingIcon,
                  tooltip: leadingTooltip,
                  onPressed: onLeadingPressed,
                ),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: scheme.onSurface,
                      ),
                    ),
                    if (subtitleText != null && subtitleText.isNotEmpty)
                      Row(
                        children: <Widget>[
                          Flexible(
                            child: Text(
                              subtitleText,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 12,
                                color: scheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                          Icon(
                            Icons.chevron_right,
                            size: 14,
                            color: scheme.onSurfaceVariant,
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              ...actions,
              const SizedBox(width: SdkworkAgentsFlutterTokens.spacingSm),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({required this.icon, this.tooltip, this.onPressed});

  final IconData icon;
  final String? tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    final TechBlueThemeColors colors = techBlueThemeColors(context);
    final button = IconButton(
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      style: IconButton.styleFrom(
        backgroundColor: scheme.surfaceContainer,
        disabledBackgroundColor: scheme.surfaceContainer,
        foregroundColor: colors.iconDefault,
        disabledForegroundColor: colors.iconDisabled,
        minimumSize: const Size(48, 48),
        padding: EdgeInsets.zero,
      ),
    );
    final label = tooltip;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: label == null || label.isEmpty
          ? button
          : Tooltip(message: label, child: button),
    );
  }
}

/// Round trailing action used for the `+` affordance in the design.
class SdkworkAgentsMobileAppBarAction extends StatelessWidget {
  const SdkworkAgentsMobileAppBarAction({
    super.key,
    required this.icon,
    required this.tooltip,
    required this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return _RoundIconButton(icon: icon, tooltip: tooltip, onPressed: onPressed);
  }
}
