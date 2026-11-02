import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

/// Icon/foreground contrast contract for both tech-blue schemes.
///
/// Guards the regression where icons resolved from `outline` or inherited a
/// primary fill and disappeared. Every asserted color is opaque, differs from
/// its background, and meets the spec thresholds (icons >= 3:1, text >= 4.5:1)
/// wherever the token is actually used as a foreground.
void main() {
  final ThemeData light = buildTechBlueTheme();
  final ThemeData dark = buildTechBlueDarkTheme();

  double contrast(Color a, Color b) {
    final double l1 = a.computeLuminance();
    final double l2 = b.computeLuminance();
    final double hi = math.max(l1, l2);
    final double lo = math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  Color effectiveIconColor(WidgetTester tester, IconData icon) {
    final Finder iconFinder = find.byIcon(icon);
    expect(iconFinder, findsOneWidget, reason: '$icon must be rendered');
    final Finder textFinder = find.descendant(
      of: iconFinder,
      matching: find.byType(RichText),
    );
    final RichText richText = tester.widget<RichText>(textFinder);
    final Color? color = richText.text.style?.color;
    expect(color, isNotNull, reason: '$icon must resolve an explicit color');
    return color!;
  }

  Widget harness(ThemeData theme) {
    return MaterialApp(
      theme: theme,
      home: Scaffold(
        body: Column(
          children: <Widget>[
            SdkworkAgentsMobileAppBar(
              title: 'Theme',
              leading: Icons.arrow_back,
              leadingTooltip: 'Back',
              onLeadingPressed: () {},
              actions: <Widget>[
                SdkworkAgentsMobileAppBarAction(
                  icon: Icons.person_outline,
                  tooltip: 'Profile',
                  onPressed: () {},
                ),
                SdkworkAgentsMobileAppBarAction(
                  icon: Icons.lock_outline,
                  tooltip: 'Disabled action',
                  onPressed: null,
                ),
              ],
            ),
            IconButton(onPressed: () {}, icon: const Icon(Icons.mic_none)),
            const Icon(Icons.home_outlined),
            Expanded(
              child: SdkworkAgentsUnavailableState(
                headline: 'Offline',
                hint: 'No transport',
                retryLabel: 'Retry',
                onRetry: () {},
              ),
            ),
            NavigationBar(
              selectedIndex: 0,
              destinations: const <NavigationDestination>[
                NavigationDestination(
                  icon: Icon(Icons.chat_bubble_outline),
                  selectedIcon: Icon(Icons.chat_bubble),
                  label: 'Chat',
                ),
                NavigationDestination(
                  icon: Icon(Icons.settings_outlined),
                  label: 'Settings',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  for (final (String name, ThemeData theme) in <(String, ThemeData)>[
    ('light', light),
    ('dark', dark),
  ]) {
    test('$name scheme keeps outline opaque and foreground roles safe', () {
      final ColorScheme scheme = theme.colorScheme;
      final TechBlueThemeColors colors = techBlueThemeColorsFor(theme);
      expect(scheme.brightness, theme.brightness);
      expect(scheme.outline.a, 1, reason: 'outline must never be transparent');
      expect(scheme.outlineVariant.a, 1);
      expect(scheme.outline, isNot(scheme.surface));

      expect(
        contrast(colors.iconDefault, scheme.surface),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        contrast(colors.iconActive, scheme.surface),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        contrast(colors.iconOnPrimary, const Color(0xFF165DFF)),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        contrast(colors.dangerText, scheme.surface),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        contrast(colors.warningText, scheme.surface),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        contrast(scheme.onSurface, scheme.surface),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        contrast(scheme.onSurfaceVariant, scheme.surface),
        greaterThanOrEqualTo(4.5),
      );
      // Disabled glyphs are exempt from WCAG contrast but must stay opaque.
      expect(colors.iconDisabled.a, 1);
      expect(colors.iconDisabled, isNot(scheme.surface));
    });

    testWidgets('$name scheme renders visible app-bar and control glyphs', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(harness(theme));
      final ColorScheme scheme = theme.colorScheme;
      final Color appBarBackground =
          theme.appBarTheme.backgroundColor ?? scheme.surface;
      final Color pageBackground = theme.scaffoldBackgroundColor;

      final Color back = effectiveIconColor(tester, Icons.arrow_back);
      final Color profile = effectiveIconColor(tester, Icons.person_outline);
      final Color disabled = effectiveIconColor(tester, Icons.lock_outline);
      final Color mic = effectiveIconColor(tester, Icons.mic_none);
      final Color plain = effectiveIconColor(tester, Icons.home_outlined);
      final Color cloud = effectiveIconColor(tester, Icons.cloud_off_outlined);
      final Color selectedTab = effectiveIconColor(tester, Icons.chat_bubble);
      final Color unselectedTab = effectiveIconColor(
        tester,
        Icons.settings_outlined,
      );

      for (final (IconData icon, Color color, Color background)
          in <(IconData, Color, Color)>[
            (Icons.arrow_back, back, appBarBackground),
            (Icons.person_outline, profile, appBarBackground),
            (Icons.mic_none, mic, pageBackground),
            (Icons.home_outlined, plain, pageBackground),
            (Icons.cloud_off_outlined, cloud, pageBackground),
            (Icons.chat_bubble, selectedTab, scheme.surface),
            (Icons.settings_outlined, unselectedTab, scheme.surface),
          ]) {
        expect(color.a, 1, reason: '$icon must be fully opaque');
        expect(color, isNot(background), reason: '$icon must differ from bg');
        expect(
          contrast(color, background),
          greaterThanOrEqualTo(3),
          reason: '$icon contrast on $name scheme',
        );
      }

      // Disabled controls are WCAG-exempt from 3:1, but must stay opaque and
      // visibly distinct from the enabled glyph.
      expect(disabled.a, 1);
      expect(disabled, isNot(appBarBackground));
      expect(disabled, isNot(profile), reason: 'disabled glyph is distinct');
      expect(selectedTab, isNot(unselectedTab));
    });
  }

  test('primary-filled actions keep a readable label/icon in both schemes', () {
    for (final ThemeData theme in <ThemeData>[light, dark]) {
      final ButtonStyle? style = theme.filledButtonTheme.style;
      expect(style, isNotNull);
      final Color background = style!.backgroundColor!.resolve(
        <WidgetState>{},
      )!;
      final Color foreground = style.foregroundColor!.resolve(<WidgetState>{})!;
      final Color icon = style.iconColor!.resolve(<WidgetState>{})!;
      expect(foreground, icon);
      expect(
        contrast(foreground, background),
        greaterThanOrEqualTo(4.5),
        reason: 'primary action copy on ${theme.brightness}',
      );
    }
  });
}

/// Mirrors the widget-facing lookup for a bare [ThemeData] in tests.
TechBlueThemeColors techBlueThemeColorsFor(ThemeData theme) {
  return theme.extension<TechBlueThemeColors>() ?? TechBlueThemeColors.light;
}
