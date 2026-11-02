import 'package:flutter/material.dart';

import 'mobile_tabs.dart';

/// Bottom-navigation frame shared by the Agents Flutter mobile root.
///
/// Layout mirrors the H5 and mini program shells: a five-slot Material 3
/// navigation bar whose labels come from an injected translator, and an
/// `IndexedStack` body so each tab keeps its own scroll position and stream
/// subscription while the user moves between them
/// (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
///
/// The frame is flat by contract (`specs/client-theme.spec.json`): the bar uses
/// the active scheme's surface, the active indicator uses its primary container,
/// and icons resolve from scheme foreground roles — so light and dark both get
/// visible glyphs with zero elevation and no top border. Screen bodies are
/// mounted by the composition root, which is what keeps capability packages
/// independent of each other.
class SdkworkAgentsAppShellFrame extends StatelessWidget {
  const SdkworkAgentsAppShellFrame({
    super.key,
    required this.tabs,
    required this.destinations,
    required this.currentIndex,
    required this.onSelectTab,
    required this.translate,
    this.primaryColor,
    this.backgroundColor,
  });

  /// Tab descriptors, in bottom-bar order.
  final List<AgentsMobileTabDescriptor> tabs;

  /// One mounted body per tab; must be the same length as [tabs].
  final List<Widget> destinations;

  final int currentIndex;
  final ValueChanged<int> onSelectTab;

  /// Resolves a tab `labelKey` to display text for the active locale.
  final String Function(String key) translate;

  /// Optional explicit override; otherwise the active scheme's primary is used.
  final int? primaryColor;

  /// Optional explicit override; otherwise the scaffold background is used.
  final int? backgroundColor;

  @override
  Widget build(BuildContext context) {
    if (tabs.length != destinations.length) {
      throw StateError(
        'SdkworkAgentsAppShellFrame received ${tabs.length} tabs and '
        '${destinations.length} destinations; they must match.',
      );
    }
    final safeIndex =
        currentIndex < 0 || currentIndex >= tabs.length ? 0 : currentIndex;
    final ColorScheme scheme = Theme.of(context).colorScheme;
    final Color activeColor =
        primaryColor == null ? scheme.primary : Color(primaryColor!);
    final Color pageBackground = backgroundColor == null
        ? Theme.of(context).scaffoldBackgroundColor
        : Color(backgroundColor!);
    return Scaffold(
      backgroundColor: pageBackground,
      body: IndexedStack(index: safeIndex, children: destinations),
      bottomNavigationBar: Semantics(
        container: true,
        explicitChildNodes: true,
        label: 'SDKWork Agents',
        child: NavigationBar(
          height: 72,
          selectedIndex: safeIndex,
          onDestinationSelected: onSelectTab,
          backgroundColor: scheme.surface,
          indicatorColor: scheme.primaryContainer,
          elevation: 0,
          shadowColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: <NavigationDestination>[
            for (final tab in tabs)
              NavigationDestination(
                icon: Icon(
                  resolveAgentsMobileTabIcon(tab.glyph, active: false),
                  color: scheme.onSurfaceVariant,
                ),
                selectedIcon: Icon(
                  resolveAgentsMobileTabIcon(tab.glyph, active: true),
                  color: activeColor,
                ),
                label: translate(tab.labelKey),
                tooltip: translate(tab.labelKey),
              ),
          ],
        ),
      ),
    );
  }
}

/// Maps the shared glyph vocabulary onto Material icons.
///
/// The glyph *name* is the shared vocabulary; each root renders it with its own
/// icon set (section 7 of `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md`).
IconData resolveAgentsMobileTabIcon(String glyph, {required bool active}) {
  switch (glyph) {
    case AgentsMobileTabGlyphs.messageSquare:
      return active ? Icons.chat_bubble : Icons.chat_bubble_outline;
    case AgentsMobileTabGlyphs.sparkles:
      return active ? Icons.auto_awesome : Icons.auto_awesome_outlined;
    case AgentsMobileTabGlyphs.wand:
      return active ? Icons.brush : Icons.brush_outlined;
    case AgentsMobileTabGlyphs.image:
      return active ? Icons.photo_library : Icons.photo_library_outlined;
    case AgentsMobileTabGlyphs.bot:
      return active ? Icons.smart_toy : Icons.smart_toy_outlined;
    case AgentsMobileTabGlyphs.infinity:
      return Icons.all_inclusive;
    case AgentsMobileTabGlyphs.bookOpen:
      return active ? Icons.menu_book : Icons.menu_book_outlined;
    case AgentsMobileTabGlyphs.timer:
      return active ? Icons.schedule : Icons.schedule_outlined;
    case AgentsMobileTabGlyphs.shareTwo:
      return active ? Icons.hub : Icons.hub_outlined;
    default:
      return Icons.circle_outlined;
  }
}
