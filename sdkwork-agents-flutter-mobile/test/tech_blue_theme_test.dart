import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

/// Contract checks for `specs/client-theme.spec.json` (`tech-blue-flat`).
///
/// These assert the properties the visual audit relies on: the tech-blue
/// palette, flat surfaces, transparent component borders, scrim-only overlays,
/// and — the regression this file guards against — visible foreground roles for
/// icons and unchecked controls.
void main() {
  final ThemeData theme = buildTechBlueTheme();
  final ThemeData darkTheme = buildTechBlueDarkTheme();

  test('dark theme uses the spec dark token set, not an inversion', () {
    expect(darkTheme.brightness, Brightness.dark);
    expect(darkTheme.useMaterial3, isTrue);
    expect(
      darkTheme.colorScheme.primary,
      const Color(SdkworkAgentsFlutterTokens.darkPrimary),
    );
    expect(
      darkTheme.colorScheme.onPrimary,
      const Color(SdkworkAgentsFlutterTokens.darkPrimaryOn),
    );
    expect(
      darkTheme.colorScheme.surface,
      const Color(SdkworkAgentsFlutterTokens.darkSurface),
    );
    expect(
      darkTheme.scaffoldBackgroundColor,
      const Color(SdkworkAgentsFlutterTokens.darkBackground),
    );
    expect(
      darkTheme.colorScheme.onSurface,
      const Color(SdkworkAgentsFlutterTokens.darkText),
    );
    expect(
      darkTheme.colorScheme.onSurfaceVariant,
      const Color(SdkworkAgentsFlutterTokens.darkTextSecondary),
    );
    expect(
      darkTheme.colorScheme.outline,
      const Color(SdkworkAgentsFlutterTokens.darkOutline),
    );
    expect(
      darkTheme.colorScheme.outlineVariant,
      const Color(SdkworkAgentsFlutterTokens.darkOutlineVariant),
    );
    expect(
      darkTheme.dialogTheme.barrierColor,
      const Color(SdkworkAgentsFlutterTokens.darkScrim),
    );
    final TechBlueThemeColors colors = darkTheme
        .extension<TechBlueThemeColors>()!;
    expect(
      colors.iconDefault,
      const Color(SdkworkAgentsFlutterTokens.darkIconDefault),
    );
    expect(
      colors.iconActive,
      const Color(SdkworkAgentsFlutterTokens.darkIconActive),
    );
    expect(
      colors.iconDisabled,
      const Color(SdkworkAgentsFlutterTokens.darkIconDisabled),
    );
  });

  test('dark theme keeps the flat contract', () {
    expect(darkTheme.dividerColor, Colors.transparent);
    expect(darkTheme.cardTheme.elevation, 0);
    expect(darkTheme.dialogTheme.elevation, 0);
    expect(darkTheme.appBarTheme.elevation, 0);
    expect(darkTheme.navigationBarTheme.elevation, 0);
    expect(darkTheme.bottomSheetTheme.modalElevation, 0);
    expect(darkTheme.colorScheme.outline.a, 1);
  });

  test('uses the tech-blue light palette', () {
    expect(theme.brightness, Brightness.light);
    expect(theme.useMaterial3, isTrue);
    expect(
      theme.colorScheme.primary,
      const Color(SdkworkAgentsFlutterTokens.colorPrimary),
    );
    expect(
      theme.colorScheme.onPrimary,
      const Color(SdkworkAgentsFlutterTokens.colorPrimaryOn),
    );
    expect(
      theme.colorScheme.surface,
      const Color(SdkworkAgentsFlutterTokens.colorSurface),
    );
    expect(
      theme.scaffoldBackgroundColor,
      const Color(SdkworkAgentsFlutterTokens.colorBackground),
    );
  });

  test('is flat: no elevation and transparent dividers', () {
    expect(theme.dividerColor, Colors.transparent);
    expect(theme.cardTheme.elevation, 0);
    expect(theme.dialogTheme.elevation, 0);
    expect(theme.appBarTheme.elevation, 0);
    expect(theme.appBarTheme.scrolledUnderElevation, 0);
    expect(theme.navigationBarTheme.elevation, 0);
    expect(theme.bottomSheetTheme.elevation, 0);
    expect(theme.bottomSheetTheme.modalElevation, 0);
  });

  test('keeps foreground roles opaque so glyphs never disappear', () {
    // `outline` is a foreground role in Material 3 (unchecked controls and
    // default glyphs). It must never be the transparent border token.
    expect(
      theme.colorScheme.outline,
      const Color(SdkworkAgentsFlutterTokens.colorTextTertiary),
    );
    expect(
      theme.colorScheme.outlineVariant,
      const Color(SdkworkAgentsFlutterTokens.colorSurfaceStrong),
    );
    expect(theme.colorScheme.outline.a, 1);
    expect(theme.colorScheme.outlineVariant.a, 1);
    expect(
      theme.colorScheme.onSurfaceVariant,
      const Color(SdkworkAgentsFlutterTokens.colorTextSecondary),
    );
    expect(
      theme.iconTheme.color,
      const Color(SdkworkAgentsFlutterTokens.colorTextSecondary),
    );
    expect(
      theme.appBarTheme.iconTheme?.color,
      const Color(SdkworkAgentsFlutterTokens.colorTextSecondary),
    );
    expect(
      theme.appBarTheme.actionsIconTheme?.color,
      const Color(SdkworkAgentsFlutterTokens.colorTextSecondary),
    );
    expect(
      theme.listTileTheme.iconColor,
      const Color(SdkworkAgentsFlutterTokens.colorTextSecondary),
    );
    expect(
      theme.chipTheme.checkmarkColor,
      const Color(SdkworkAgentsFlutterTokens.colorPrimary),
    );
  });

  test('navigation bar resolves active and default icon/label colors', () {
    final WidgetStateProperty<IconThemeData?> iconTheme =
        theme.navigationBarTheme.iconTheme!;
    final WidgetStateProperty<TextStyle?> labelTheme =
        theme.navigationBarTheme.labelTextStyle!;
    expect(
      iconTheme.resolve(<WidgetState>{})?.color,
      const Color(SdkworkAgentsFlutterTokens.colorTextSecondary),
    );
    expect(
      iconTheme.resolve(<WidgetState>{WidgetState.selected})?.color,
      const Color(SdkworkAgentsFlutterTokens.colorPrimary),
    );
    expect(
      labelTheme.resolve(<WidgetState>{})?.color,
      const Color(SdkworkAgentsFlutterTokens.colorTextSecondary),
    );
    expect(
      labelTheme.resolve(<WidgetState>{WidgetState.selected})?.color,
      const Color(SdkworkAgentsFlutterTokens.colorPrimary),
    );
  });

  test('switch resolves every state to an explicit visible token', () {
    final WidgetStateProperty<Color?> thumb = theme.switchTheme.thumbColor!;
    final WidgetStateProperty<Color?> track = theme.switchTheme.trackColor!;
    expect(
      thumb.resolve(<WidgetState>{}),
      const Color(SdkworkAgentsFlutterTokens.colorTextSecondary),
    );
    expect(
      thumb.resolve(<WidgetState>{WidgetState.selected}),
      const Color(SdkworkAgentsFlutterTokens.colorPrimaryOn),
    );
    expect(
      thumb.resolve(<WidgetState>{WidgetState.disabled}),
      const Color(SdkworkAgentsFlutterTokens.colorTextTertiary),
    );
    expect(
      track.resolve(<WidgetState>{}),
      const Color(SdkworkAgentsFlutterTokens.colorSurfaceStrong),
    );
    expect(
      track.resolve(<WidgetState>{WidgetState.selected}),
      const Color(SdkworkAgentsFlutterTokens.colorPrimary),
    );
    expect(
      track.resolve(<WidgetState>{WidgetState.disabled}),
      const Color(SdkworkAgentsFlutterTokens.colorSurfaceMuted),
    );
  });

  test('uses the contract surface, indicator, and input tokens', () {
    expect(
      theme.cardTheme.color,
      const Color(SdkworkAgentsFlutterTokens.colorSurface),
    );
    expect(
      theme.navigationBarTheme.backgroundColor,
      const Color(SdkworkAgentsFlutterTokens.colorSurface),
    );
    expect(
      theme.navigationBarTheme.indicatorColor,
      const Color(SdkworkAgentsFlutterTokens.colorPrimarySubtle),
    );
    expect(theme.inputDecorationTheme.filled, isTrue);
    expect(
      theme.inputDecorationTheme.fillColor,
      const Color(SdkworkAgentsFlutterTokens.colorSurfaceMuted),
    );
  });

  test('overlays use only the navy scrim', () {
    expect(
      theme.dialogTheme.barrierColor,
      const Color(SdkworkAgentsFlutterTokens.colorScrim),
    );
    expect(
      theme.bottomSheetTheme.modalBarrierColor,
      const Color(SdkworkAgentsFlutterTokens.colorScrim),
    );
  });
}
