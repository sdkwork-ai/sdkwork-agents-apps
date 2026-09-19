import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';

/// Mobile app bar shared by the Agents Flutter capability screens.
///
/// Matches the mobile design language used on the H5 root: a compact bar with a
/// leading round affordance, a title with an optional second line (the active
/// task or expert), and trailing actions
/// (`APP_FLUTTER_UI_SPEC.md` — capability packages own their screen chrome).
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

  /// Leading glyph. Defaults to the shell menu glyph when null.
  final IconData? leading;
  final String? leadingTooltip;
  final List<Widget> actions;
  final VoidCallback? onLeadingPressed;

  @override
  Widget build(BuildContext context) {
    final subtitleText = subtitle;
    return Material(
      color: Colors.white,
      child: SafeArea(
        bottom: false,
        child: SizedBox(
          height: 56,
          child: Row(
            children: <Widget>[
              const SizedBox(width: SdkworkAgentsFlutterTokens.spacingSm),
              _RoundIconButton(
                icon: leading ?? Icons.menu,
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
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(SdkworkAgentsFlutterTokens.colorText),
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
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(SdkworkAgentsFlutterTokens.colorTextMuted),
                              ),
                            ),
                          ),
                          const Icon(
                            Icons.chevron_right,
                            size: 14,
                            color: Color(SdkworkAgentsFlutterTokens.colorTextMuted),
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
    final button = IconButton(
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      style: IconButton.styleFrom(
        backgroundColor: const Color(0xFFF1F5F9),
        foregroundColor: const Color(SdkworkAgentsFlutterTokens.colorText),
        minimumSize: const Size(36, 36),
        padding: EdgeInsets.zero,
      ),
    );
    final label = tooltip;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: label == null || label.isEmpty ? button : Tooltip(message: label, child: button),
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
