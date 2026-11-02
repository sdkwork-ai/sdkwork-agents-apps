/// Cross-client tech-blue flat theme for the SDKWork Agents Flutter mobile root.
///
/// Authority: `specs/client-theme.spec.json` (`tech-blue-flat`, light base with
/// a complete dark token set). The same tokens are mirrored by the PC, H5, mini
/// program, and HarmonyOS roots, so a color or radius change must land in that
/// spec first.
///
/// Flat rules enforced here and at the screens:
/// - no decorative borders (surface separation comes from tonal fill),
/// - no elevation and no drop shadows anywhere,
/// - no gradients,
/// - dialogs and modal sheets use the scrim only.
///
/// Icon colors are foreground tokens (see [TechBlueThemeColors]); a border,
/// outline, surface, or transparent token is never used for a glyph.
library;

import 'package:flutter/material.dart';

/// Tech-blue design tokens shared by every Flutter mobile surface.
///
/// Values are integer ARGB literals so the tokens can be used in `const`
/// expressions, matching the other client roots that consume the same spec.
class SdkworkAgentsFlutterTokens {
  const SdkworkAgentsFlutterTokens._();

  // Brand accent (light).
  static const int colorPrimary = 0xFF165DFF;
  static const int colorPrimaryHover = 0xFF4080FF;
  static const int colorPrimaryPressed = 0xFF0E42D2;
  static const int colorPrimarySubtle = 0xFFE8F0FF;
  static const int colorPrimaryOn = 0xFFFFFFFF;

  // Neutral surfaces (light).
  static const int colorBackground = 0xFFF4F7FC;
  static const int colorSurface = 0xFFFFFFFF;
  static const int colorSurfaceMuted = 0xFFEAF1FB;
  static const int colorSurfaceStrong = 0xFFDCE8F9;

  // Deep-navy navigation rail (shared with the PC workbench tokens).
  static const int colorRail = 0xFF0A1B3D;
  static const int colorRailActive = 0xFF165DFF;
  static const int colorRailText = 0xFFC9D6EA;
  static const int colorRailTextMuted = 0xFF7F91B0;

  // Text scale (light).
  static const int colorText = 0xFF0A1B3D;
  static const int colorTextSecondary = 0xFF5B6B88;
  static const int colorTextTertiary = 0xFF8A97AD;

  /// Legacy name kept for capability screens; maps to secondary text.
  static const int colorTextMuted = colorTextSecondary;

  // Status (light).
  static const int colorSuccess = 0xFF00B42A;
  static const int colorWarning = 0xFFFF7D00;
  static const int colorDanger = 0xFFF53F3F;

  /// WCAG-AA text variants of the status accents (light), used for 12px copy.
  static const int colorWarningText = 0xFFB45309;
  static const int colorDangerText = 0xFFB91C1C;

  /// Borders are transparent by contract: separation is tonal, never a 1px line.
  static const int colorBorder = 0x00000000;

  /// `rgba(10, 27, 61, 0.45)` — the only modal overlay color allowed (light).
  static const int colorScrim = 0x730A1B3D;

  // ---------------------------------------------------------------------------
  // Dark token set. This is its own palette, never an inversion of the light
  // one (`specs/client-theme.spec.json` -> `dark`).
  // ---------------------------------------------------------------------------

  static const int darkBackground = 0xFF0A1224;
  static const int darkSurface = 0xFF111C33;
  static const int darkSurfaceMuted = 0xFF17233D;
  static const int darkSurfaceStrong = 0xFF1F2E4D;
  static const int darkRail = 0xFF060E1E;

  static const int darkPrimary = 0xFF4080FF;
  static const int darkPrimaryHover = 0xFF6AA0FF;
  static const int darkPrimaryPressed = 0xFF165DFF;
  static const int darkPrimarySubtle = 0xFF16305C;
  static const int darkPrimaryOn = 0xFFFFFFFF;

  static const int darkText = 0xFFEAF1FB;
  static const int darkTextSecondary = 0xFFA9B7D0;
  static const int darkTextTertiary = 0xFF7F91B0;

  static const int darkSuccess = 0xFF23C343;
  static const int darkWarning = 0xFFFF9A2E;
  static const int darkDanger = 0xFFFF7875;

  /// `rgba(0, 0, 0, 0.6)`.
  static const int darkScrim = 0x99000000;

  static const int darkBorder = 0x00000000;
  static const int darkOutline = 0xFF7F91B0;
  static const int darkOutlineVariant = 0xFF24344F;

  // ---------------------------------------------------------------------------
  // Icon semantics (`iconColors` in the spec). Values are duplicated as named
  // semantic tokens so a screen never has to reach for `outline` or `surface`.
  // ---------------------------------------------------------------------------

  static const int iconDefault = colorTextSecondary;
  static const int iconStrong = colorText;
  static const int iconActive = colorPrimary;
  static const int iconOnPrimary = colorPrimaryOn;
  static const int iconOnRail = colorRailText;
  static const int iconDisabled = colorTextTertiary;

  static const int darkIconDefault = darkTextSecondary;
  static const int darkIconStrong = darkText;
  static const int darkIconActive = darkPrimary;
  static const int darkIconOnPrimary = darkPrimaryOn;
  static const int darkIconOnRail = colorRailText;
  static const int darkIconDisabled = darkTextTertiary;

  // Shape.
  static const double radiusSm = 8;
  static const double radiusMd = 12;
  static const double radiusLg = 16;
  static const double radiusPill = 999;

  static const double focusOutlineWidth = 2;
  static const double focusOutlineOffset = 2;

  // Spacing.
  static const double spacingSm = 8;
  static const double spacingMd = 16;
  static const double spacingLg = 24;
}

/// Semantic foreground colors for glyphs and status copy.
///
/// Registered as a [ThemeExtension] on both themes so a widget can resolve an
/// icon color without knowing which brightness is active and without ever
/// touching `outline`, `border`, `surface`, or a transparent token.
@immutable
class TechBlueThemeColors extends ThemeExtension<TechBlueThemeColors> {
  const TechBlueThemeColors({
    required this.iconDefault,
    required this.iconStrong,
    required this.iconActive,
    required this.iconOnPrimary,
    required this.iconOnRail,
    required this.iconDisabled,
    required this.dangerText,
    required this.warningText,
  });

  /// Secondary-content glyph (back arrows, row leading icons, chevrons).
  final Color iconDefault;

  /// High-emphasis glyph (selected item, avatar glyph).
  final Color iconStrong;

  /// Active/selected accent glyph.
  final Color iconActive;

  /// Glyph sitting on a primary-filled surface (send/save/retry/generate).
  final Color iconOnPrimary;

  /// Glyph sitting on the deep-navy rail.
  final Color iconOnRail;

  /// Disabled glyph.
  final Color iconDisabled;

  /// Accessible error copy at 12px.
  final Color dangerText;

  /// Accessible warning copy at 12px.
  final Color warningText;

  static const TechBlueThemeColors light = TechBlueThemeColors(
    iconDefault: Color(SdkworkAgentsFlutterTokens.iconDefault),
    iconStrong: Color(SdkworkAgentsFlutterTokens.iconStrong),
    iconActive: Color(SdkworkAgentsFlutterTokens.iconActive),
    iconOnPrimary: Color(SdkworkAgentsFlutterTokens.iconOnPrimary),
    iconOnRail: Color(SdkworkAgentsFlutterTokens.iconOnRail),
    iconDisabled: Color(SdkworkAgentsFlutterTokens.iconDisabled),
    dangerText: Color(SdkworkAgentsFlutterTokens.colorDangerText),
    warningText: Color(SdkworkAgentsFlutterTokens.colorWarningText),
  );

  static const TechBlueThemeColors dark = TechBlueThemeColors(
    iconDefault: Color(SdkworkAgentsFlutterTokens.darkIconDefault),
    iconStrong: Color(SdkworkAgentsFlutterTokens.darkIconStrong),
    iconActive: Color(SdkworkAgentsFlutterTokens.darkIconActive),
    iconOnPrimary: Color(SdkworkAgentsFlutterTokens.darkIconOnPrimary),
    iconOnRail: Color(SdkworkAgentsFlutterTokens.darkIconOnRail),
    iconDisabled: Color(SdkworkAgentsFlutterTokens.darkIconDisabled),
    dangerText: Color(SdkworkAgentsFlutterTokens.darkDanger),
    warningText: Color(SdkworkAgentsFlutterTokens.darkWarning),
  );

  @override
  TechBlueThemeColors copyWith({
    Color? iconDefault,
    Color? iconStrong,
    Color? iconActive,
    Color? iconOnPrimary,
    Color? iconOnRail,
    Color? iconDisabled,
    Color? dangerText,
    Color? warningText,
  }) {
    return TechBlueThemeColors(
      iconDefault: iconDefault ?? this.iconDefault,
      iconStrong: iconStrong ?? this.iconStrong,
      iconActive: iconActive ?? this.iconActive,
      iconOnPrimary: iconOnPrimary ?? this.iconOnPrimary,
      iconOnRail: iconOnRail ?? this.iconOnRail,
      iconDisabled: iconDisabled ?? this.iconDisabled,
      dangerText: dangerText ?? this.dangerText,
      warningText: warningText ?? this.warningText,
    );
  }

  @override
  TechBlueThemeColors lerp(covariant TechBlueThemeColors? other, double t) {
    if (other == null) {
      return this;
    }
    return TechBlueThemeColors(
      iconDefault: Color.lerp(iconDefault, other.iconDefault, t)!,
      iconStrong: Color.lerp(iconStrong, other.iconStrong, t)!,
      iconActive: Color.lerp(iconActive, other.iconActive, t)!,
      iconOnPrimary: Color.lerp(iconOnPrimary, other.iconOnPrimary, t)!,
      iconOnRail: Color.lerp(iconOnRail, other.iconOnRail, t)!,
      iconDisabled: Color.lerp(iconDisabled, other.iconDisabled, t)!,
      dangerText: Color.lerp(dangerText, other.dangerText, t)!,
      warningText: Color.lerp(warningText, other.warningText, t)!,
    );
  }
}

/// Resolves the semantic glyph/status colors for the active theme.
TechBlueThemeColors techBlueThemeColors(BuildContext context) {
  return Theme.of(context).extension<TechBlueThemeColors>() ??
      TechBlueThemeColors.light;
}

/// Maps the persisted `system` / `light` / `dark` wire value onto [ThemeMode].
///
/// Unknown values fall back to `system`, matching the spec default.
ThemeMode resolveTechBlueThemeMode(String? wireValue) {
  switch (wireValue) {
    case 'light':
      return ThemeMode.light;
    case 'dark':
      return ThemeMode.dark;
    default:
      return ThemeMode.system;
  }
}

/// Builds the light tech-blue theme.
ThemeData buildTechBlueTheme() {
  return _buildTechBlueTheme(_TechBluePalette.light);
}

/// Builds the dark tech-blue theme from the spec `dark` token set.
ThemeData buildTechBlueDarkTheme() {
  return _buildTechBlueTheme(_TechBluePalette.dark);
}

class _TechBluePalette {
  const _TechBluePalette({
    required this.brightness,
    required this.background,
    required this.surface,
    required this.surfaceMuted,
    required this.surfaceStrong,
    required this.primary,
    required this.primaryHover,
    required this.primaryPressed,
    required this.primarySubtle,
    required this.primaryOn,
    required this.text,
    required this.textSecondary,
    required this.textTertiary,
    required this.outline,
    required this.outlineVariant,
    required this.border,
    required this.scrim,
    required this.danger,
    required this.dangerText,
    required this.warningText,
    required this.rail,
    required this.railText,
    required this.filledButton,
    required this.filledButtonHover,
    required this.filledButtonPressed,
  });

  final Brightness brightness;
  final Color background;
  final Color surface;
  final Color surfaceMuted;
  final Color surfaceStrong;
  final Color primary;
  final Color primaryHover;
  final Color primaryPressed;
  final Color primarySubtle;
  final Color primaryOn;
  final Color text;
  final Color textSecondary;
  final Color textTertiary;
  final Color outline;
  final Color outlineVariant;
  final Color border;
  final Color scrim;
  final Color danger;
  final Color dangerText;
  final Color warningText;
  final Color rail;
  final Color railText;

  /// Background of a primary-filled action. Both palettes resolve to the
  /// brand `#165DFF` action fill so the white label/icon keeps >= 4.5:1
  /// against it (white on the bright dark-mode accent is only 3.7:1).
  final Color filledButton;
  final Color filledButtonHover;
  final Color filledButtonPressed;

  static const _TechBluePalette light = _TechBluePalette(
    brightness: Brightness.light,
    background: Color(SdkworkAgentsFlutterTokens.colorBackground),
    surface: Color(SdkworkAgentsFlutterTokens.colorSurface),
    surfaceMuted: Color(SdkworkAgentsFlutterTokens.colorSurfaceMuted),
    surfaceStrong: Color(SdkworkAgentsFlutterTokens.colorSurfaceStrong),
    primary: Color(SdkworkAgentsFlutterTokens.colorPrimary),
    primaryHover: Color(SdkworkAgentsFlutterTokens.colorPrimaryHover),
    primaryPressed: Color(SdkworkAgentsFlutterTokens.colorPrimaryPressed),
    primarySubtle: Color(SdkworkAgentsFlutterTokens.colorPrimarySubtle),
    primaryOn: Color(SdkworkAgentsFlutterTokens.colorPrimaryOn),
    text: Color(SdkworkAgentsFlutterTokens.colorText),
    textSecondary: Color(SdkworkAgentsFlutterTokens.colorTextSecondary),
    textTertiary: Color(SdkworkAgentsFlutterTokens.colorTextTertiary),
    outline: Color(SdkworkAgentsFlutterTokens.colorTextTertiary),
    outlineVariant: Color(SdkworkAgentsFlutterTokens.colorSurfaceStrong),
    border: Color(SdkworkAgentsFlutterTokens.colorBorder),
    scrim: Color(SdkworkAgentsFlutterTokens.colorScrim),
    danger: Color(SdkworkAgentsFlutterTokens.colorDanger),
    dangerText: Color(SdkworkAgentsFlutterTokens.colorDangerText),
    warningText: Color(SdkworkAgentsFlutterTokens.colorWarningText),
    rail: Color(SdkworkAgentsFlutterTokens.colorRail),
    railText: Color(SdkworkAgentsFlutterTokens.colorRailText),
    filledButton: Color(SdkworkAgentsFlutterTokens.colorPrimary),
    filledButtonHover: Color(SdkworkAgentsFlutterTokens.colorPrimaryHover),
    filledButtonPressed: Color(SdkworkAgentsFlutterTokens.colorPrimaryPressed),
  );

  static const _TechBluePalette dark = _TechBluePalette(
    brightness: Brightness.dark,
    background: Color(SdkworkAgentsFlutterTokens.darkBackground),
    surface: Color(SdkworkAgentsFlutterTokens.darkSurface),
    surfaceMuted: Color(SdkworkAgentsFlutterTokens.darkSurfaceMuted),
    surfaceStrong: Color(SdkworkAgentsFlutterTokens.darkSurfaceStrong),
    primary: Color(SdkworkAgentsFlutterTokens.darkPrimary),
    primaryHover: Color(SdkworkAgentsFlutterTokens.darkPrimaryHover),
    primaryPressed: Color(SdkworkAgentsFlutterTokens.darkPrimaryPressed),
    primarySubtle: Color(SdkworkAgentsFlutterTokens.darkPrimarySubtle),
    primaryOn: Color(SdkworkAgentsFlutterTokens.darkPrimaryOn),
    text: Color(SdkworkAgentsFlutterTokens.darkText),
    textSecondary: Color(SdkworkAgentsFlutterTokens.darkTextSecondary),
    textTertiary: Color(SdkworkAgentsFlutterTokens.darkTextTertiary),
    outline: Color(SdkworkAgentsFlutterTokens.darkOutline),
    outlineVariant: Color(SdkworkAgentsFlutterTokens.darkOutlineVariant),
    border: Color(SdkworkAgentsFlutterTokens.darkBorder),
    scrim: Color(SdkworkAgentsFlutterTokens.darkScrim),
    danger: Color(SdkworkAgentsFlutterTokens.darkDanger),
    dangerText: Color(SdkworkAgentsFlutterTokens.darkDanger),
    warningText: Color(SdkworkAgentsFlutterTokens.darkWarning),
    rail: Color(SdkworkAgentsFlutterTokens.darkRail),
    railText: Color(SdkworkAgentsFlutterTokens.colorRailText),
    filledButton: Color(SdkworkAgentsFlutterTokens.darkPrimaryPressed),
    filledButtonHover: Color(SdkworkAgentsFlutterTokens.darkPrimary),
    filledButtonPressed: Color(SdkworkAgentsFlutterTokens.darkPrimaryPressed),
  );
}

ThemeData _buildTechBlueTheme(_TechBluePalette p) {
  final bool isDark = p.brightness == Brightness.dark;
  final ColorScheme scheme = ColorScheme.fromSeed(
    seedColor: p.primary,
    brightness: p.brightness,
  ).copyWith(
    primary: p.primary,
    onPrimary: p.primaryOn,
    primaryContainer: p.primarySubtle,
    onPrimaryContainer: p.text,
    secondary: p.primaryHover,
    onSecondary: p.primaryOn,
    secondaryContainer: p.primarySubtle,
    onSecondaryContainer: isDark ? p.text : p.primary,
    surface: p.surface,
    onSurface: p.text,
    onSurfaceVariant: p.textSecondary,
    surfaceContainerLowest: isDark ? p.background : p.surface,
    surfaceContainerLow: isDark ? p.surface : p.background,
    surfaceContainer: p.surfaceMuted,
    surfaceContainerHigh: p.surfaceMuted,
    surfaceContainerHighest: p.surfaceStrong,
    // Outline is a foreground role for icons and unchecked controls in M3; it
    // must never be transparent or those glyphs disappear.
    outline: p.outline,
    outlineVariant: p.outlineVariant,
    // ignore: deprecated_member_use
    background: p.background,
    error: p.danger,
    onError: isDark ? p.background : p.primaryOn,
  );

  final TextTheme textTheme = Typography.material2021().black.apply(
        bodyColor: p.text,
        displayColor: p.text,
      );

  return ThemeData(
    useMaterial3: true,
    brightness: p.brightness,
    colorScheme: scheme,
    textTheme: textTheme,
    scaffoldBackgroundColor: p.background,
    canvasColor: p.surface,
    dividerColor: Colors.transparent,
    dividerTheme: const DividerThemeData(
      color: Colors.transparent,
      thickness: 0,
      space: 0,
    ),
    iconTheme: IconThemeData(color: p.textSecondary),
    extensions: <ThemeExtension<dynamic>>[
      isDark ? TechBlueThemeColors.dark : TechBlueThemeColors.light,
    ],
    focusColor: p.primary.withValues(alpha: 0.2),
    textSelectionTheme: TextSelectionThemeData(
      cursorColor: p.primary,
      selectionColor: p.primary.withValues(alpha: 0.3),
      selectionHandleColor: p.primary,
    ),
    appBarTheme: AppBarThemeData(
      backgroundColor: p.background,
      foregroundColor: p.text,
      elevation: 0,
      scrolledUnderElevation: 0,
      shadowColor: p.border,
      surfaceTintColor: p.border,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: p.text,
      ),
      iconTheme: IconThemeData(color: p.textSecondary, size: 22),
      actionsIconTheme: IconThemeData(color: p.textSecondary, size: 22),
    ),
    cardTheme: CardThemeData(
      color: p.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shadowColor: p.border,
      surfaceTintColor: p.border,
      clipBehavior: Clip.antiAlias,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(
          Radius.circular(SdkworkAgentsFlutterTokens.radiusMd),
        ),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: p.surface,
      indicatorColor: p.primarySubtle,
      elevation: 0,
      height: 72,
      shadowColor: p.border,
      surfaceTintColor: p.border,
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      labelTextStyle: WidgetStateProperty.resolveWith<TextStyle>((
        Set<WidgetState> states,
      ) {
        final bool selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 12,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
          color: selected ? p.primary : p.textSecondary,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith<IconThemeData>((
        Set<WidgetState> states,
      ) {
        final bool selected = states.contains(WidgetState.selected);
        return IconThemeData(
          size: 24,
          color: selected ? p.primary : p.textSecondary,
        );
      }),
    ),
    inputDecorationTheme: InputDecorationThemeData(
      filled: true,
      fillColor: p.surfaceMuted,
      // A rounded fill with a zero-width border: no idle underline or line.
      border: const OutlineInputBorder(
        borderRadius: BorderRadius.all(
          Radius.circular(SdkworkAgentsFlutterTokens.radiusMd),
        ),
        borderSide: BorderSide.none,
      ),
      // Focus stays visible as a 2px tech-blue outline (never a resting border).
      focusedBorder: OutlineInputBorder(
        borderRadius: const BorderRadius.all(
          Radius.circular(SdkworkAgentsFlutterTokens.radiusMd),
        ),
        borderSide: BorderSide(
          color: p.primary,
          width: SdkworkAgentsFlutterTokens.focusOutlineWidth,
        ),
      ),
      hintStyle: TextStyle(fontSize: 14, color: p.textSecondary),
      labelStyle: TextStyle(fontSize: 14, color: p.textSecondary),
      floatingLabelStyle: TextStyle(fontSize: 13, color: p.primary),
      prefixIconColor: p.textSecondary,
      suffixIconColor: p.textSecondary,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: ButtonStyle(
        backgroundColor: WidgetStateProperty.resolveWith<Color>((
          Set<WidgetState> states,
        ) {
          if (states.contains(WidgetState.disabled)) {
            return p.surfaceStrong;
          }
          if (states.contains(WidgetState.pressed)) {
            return p.filledButtonPressed;
          }
          if (states.contains(WidgetState.hovered) ||
              states.contains(WidgetState.focused)) {
            return p.filledButtonHover;
          }
          return p.filledButton;
        }),
        foregroundColor: WidgetStateProperty.resolveWith<Color>((
          Set<WidgetState> states,
        ) {
          return states.contains(WidgetState.disabled)
              ? p.textTertiary
              : p.primaryOn;
        }),
        iconColor: WidgetStateProperty.resolveWith<Color>((
          Set<WidgetState> states,
        ) {
          return states.contains(WidgetState.disabled)
              ? p.textTertiary
              : p.primaryOn;
        }),
        overlayColor: const WidgetStatePropertyAll<Color>(Colors.transparent),
        elevation: const WidgetStatePropertyAll<double>(0),
        shadowColor: WidgetStatePropertyAll<Color>(p.border),
        surfaceTintColor: WidgetStatePropertyAll<Color>(p.border),
        minimumSize: const WidgetStatePropertyAll<Size>(Size(64, 48)),
        padding: const WidgetStatePropertyAll<EdgeInsetsGeometry>(
          EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        ),
        shape: const WidgetStatePropertyAll<OutlinedBorder>(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.all(
              Radius.circular(SdkworkAgentsFlutterTokens.radiusMd),
            ),
          ),
        ),
        textStyle: const WidgetStatePropertyAll<TextStyle>(
          TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: ButtonStyle(
        foregroundColor: WidgetStatePropertyAll<Color>(p.primary),
        overlayColor: const WidgetStatePropertyAll<Color>(Colors.transparent),
        elevation: const WidgetStatePropertyAll<double>(0),
        minimumSize: const WidgetStatePropertyAll<Size>(Size(48, 48)),
        shape: const WidgetStatePropertyAll<OutlinedBorder>(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.all(
              Radius.circular(SdkworkAgentsFlutterTokens.radiusSm),
            ),
          ),
        ),
        textStyle: const WidgetStatePropertyAll<TextStyle>(
          TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: p.surfaceMuted,
      selectedColor: p.primarySubtle,
      disabledColor: p.surfaceMuted,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: p.textSecondary,
      ),
      secondaryLabelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: isDark ? p.text : p.primary,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      elevation: 0,
      pressElevation: 0,
      checkmarkColor: p.primary,
      deleteIconColor: p.textSecondary,
      surfaceTintColor: p.border,
      shape: const StadiumBorder(),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        backgroundColor: WidgetStateProperty.resolveWith<Color>((
          Set<WidgetState> states,
        ) {
          return states.contains(WidgetState.selected)
              ? p.primarySubtle
              : p.surface;
        }),
        foregroundColor: WidgetStateProperty.resolveWith<Color>((
          Set<WidgetState> states,
        ) {
          if (states.contains(WidgetState.selected)) {
            return isDark ? p.text : p.primary;
          }
          return p.textSecondary;
        }),
        iconColor: WidgetStateProperty.resolveWith<Color>((
          Set<WidgetState> states,
        ) {
          return states.contains(WidgetState.selected)
              ? p.primary
              : p.textSecondary;
        }),
        elevation: const WidgetStatePropertyAll<double>(0),
        minimumSize: const WidgetStatePropertyAll<Size>(Size(48, 48)),
        textStyle: const WidgetStatePropertyAll<TextStyle>(
          TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        shape: const WidgetStatePropertyAll<OutlinedBorder>(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.all(
              Radius.circular(SdkworkAgentsFlutterTokens.radiusSm),
            ),
          ),
        ),
      ),
    ),
    listTileTheme: ListTileThemeData(
      iconColor: p.textSecondary,
      textColor: p.text,
      selectedColor: isDark ? p.text : p.primary,
      selectedTileColor: p.primarySubtle,
      titleTextStyle: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w500,
        color: p.text,
      ),
      subtitleTextStyle: TextStyle(fontSize: 12, color: p.textSecondary),
    ),
    // The reasoning disclosure chevron must stay visible in both states.
    expansionTileTheme: ExpansionTileThemeData(
      iconColor: p.textSecondary,
      collapsedIconColor: p.textSecondary,
      textColor: p.text,
      collapsedTextColor: p.text,
      backgroundColor: Colors.transparent,
      collapsedBackgroundColor: Colors.transparent,
    ),
    // Unchecked switches previously depended on `outline`; resolve every state
    // to an explicit token so the thumb and track can never disappear.
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith<Color>((
        Set<WidgetState> states,
      ) {
        if (states.contains(WidgetState.disabled)) {
          return p.textTertiary;
        }
        return states.contains(WidgetState.selected)
            ? p.primaryOn
            : p.textSecondary;
      }),
      trackColor: WidgetStateProperty.resolveWith<Color>((
        Set<WidgetState> states,
      ) {
        if (states.contains(WidgetState.disabled)) {
          return p.surfaceMuted;
        }
        return states.contains(WidgetState.selected)
            ? p.primary
            : p.surfaceStrong;
      }),
      trackOutlineColor: WidgetStatePropertyAll<Color>(p.border),
      materialTapTargetSize: MaterialTapTargetSize.padded,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: p.surface,
      modalBackgroundColor: p.surface,
      elevation: 0,
      modalElevation: 0,
      shadowColor: p.border,
      surfaceTintColor: p.border,
      modalBarrierColor: p.scrim,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(SdkworkAgentsFlutterTokens.radiusLg),
        ),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: p.surface,
      elevation: 0,
      shadowColor: p.border,
      surfaceTintColor: p.border,
      barrierColor: p.scrim,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(
          Radius.circular(SdkworkAgentsFlutterTokens.radiusLg),
        ),
      ),
      titleTextStyle: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: p.text,
      ),
      contentTextStyle: TextStyle(
        fontSize: 14,
        height: 1.5,
        color: p.textSecondary,
      ),
    ),
    popupMenuTheme: PopupMenuThemeData(
      color: p.surface,
      elevation: 0,
      shadowColor: p.border,
      surfaceTintColor: p.border,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(
          Radius.circular(SdkworkAgentsFlutterTokens.radiusMd),
        ),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: p.rail,
      contentTextStyle: TextStyle(fontSize: 13, color: p.railText),
      actionTextColor: p.primaryHover,
      behavior: SnackBarBehavior.floating,
      elevation: 0,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(
          Radius.circular(SdkworkAgentsFlutterTokens.radiusMd),
        ),
      ),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: p.primary,
      linearTrackColor: p.surfaceStrong,
      circularTrackColor: p.surfaceStrong,
    ),
  );
}
