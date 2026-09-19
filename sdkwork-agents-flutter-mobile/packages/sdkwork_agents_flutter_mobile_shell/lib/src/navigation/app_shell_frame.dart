import 'package:flutter/material.dart';

import 'mobile_tabs.dart';

/// Bottom-navigation frame shared by the Agents Flutter mobile root.
///
/// Layout mirrors the H5 and mini program shells: a five-slot bottom bar whose
/// labels come from an injected translator, and an `IndexedStack` body so each
/// tab keeps its own scroll position and stream subscription while the user
/// moves between them (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7).
///
/// The frame owns navigation mechanics only. Screen bodies are mounted by the
/// composition root, which is what keeps capability packages independent of
/// each other.
class SdkworkAgentsAppShellFrame extends StatelessWidget {
  const SdkworkAgentsAppShellFrame({
    super.key,
    required this.tabs,
    required this.destinations,
    required this.currentIndex,
    required this.onSelectTab,
    required this.translate,
    this.primaryColor = defaultPrimaryColor,
    this.backgroundColor = defaultBackgroundColor,
  });

  static const int defaultPrimaryColor = 0xFF0F766E;
  static const int defaultBackgroundColor = 0xFFF8FAFC;

  /// Tab descriptors, in bottom-bar order.
  final List<AgentsMobileTabDescriptor> tabs;

  /// One mounted body per tab; must be the same length as [tabs].
  final List<Widget> destinations;

  final int currentIndex;
  final ValueChanged<int> onSelectTab;

  /// Resolves a tab `labelKey` to display text for the active locale.
  final String Function(String key) translate;

  final int primaryColor;
  final int backgroundColor;

  @override
  Widget build(BuildContext context) {
    if (tabs.length != destinations.length) {
      throw StateError(
        'SdkworkAgentsAppShellFrame received ${tabs.length} tabs and '
        '${destinations.length} destinations; they must match.',
      );
    }
    final safeIndex = currentIndex < 0 || currentIndex >= tabs.length ? 0 : currentIndex;
    return Scaffold(
      backgroundColor: Color(backgroundColor),
      body: IndexedStack(index: safeIndex, children: destinations),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: safeIndex,
        selectedItemColor: Color(primaryColor),
        unselectedItemColor: const Color(0xFF64748B),
        backgroundColor: Colors.white,
        showUnselectedLabels: true,
        onTap: onSelectTab,
        items: <BottomNavigationBarItem>[
          for (final tab in tabs)
            BottomNavigationBarItem(
              icon: Icon(resolveAgentsMobileTabIcon(tab.glyph, active: false)),
              activeIcon: Icon(resolveAgentsMobileTabIcon(tab.glyph, active: true)),
              label: translate(tab.labelKey),
            ),
        ],
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
