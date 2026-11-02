/**
 * SDKWork Agents HarmonyOS design tokens — `tech-blue-flat` light theme.
 *
 * Authority: `specs/client-theme.spec.json` (`theme: tech-blue-flat`,
 * `base: light`), consumed through `APP_HARMONY_NATIVE_UI_SPEC.md` section 5
 * ("theme usage must come from the app design system or package-injected theme
 * adapters"). Domain packages must never re-declare colours, radii, or spacing;
 * they resolve everything from this file through the commons barrel so the
 * cross-client tokens stay in one place.
 *
 * Theme rules encoded here:
 * - Flat surfaces: depth comes from tonal fill (`surface`, `surfaceMuted`,
 *   `surfaceStrong`) and the sheet scrim only. There is no shadow token to
 *   reach for and no gradient is defined.
 * - No decorative borders: `colorBorder` is transparent and `borderWidth` is the
 *   theme's only stroke width — zero — so a stray border call cannot paint a
 *   1px line.
 * - Focus stays visible through a 2vp outline in `colorFocusOutline`.
 * - The deep-navy rail tokens exist for the shared token set; a phone bottom-tab
 *   shell paints no rail, so they are consumed only if a rail surface appears.
 */
export class SdkworkAgentsHarmonyTokens {
  // --- Brand ---------------------------------------------------------------
  static readonly colorPrimary: string = '#165DFF';
  static readonly colorPrimaryHover: string = '#4080FF';
  static readonly colorPrimaryPressed: string = '#0E42D2';
  static readonly colorPrimarySubtle: string = '#E8F0FF';
  /** Foreground for content painted on `colorPrimary`. */
  static readonly colorOnPrimary: string = '#FFFFFF';

  // --- Base surfaces -------------------------------------------------------
  /** Page background behind every card and row. */
  static readonly colorBackground: string = '#F4F7FC';
  /** Card, list-row, tab-bar, and header fill. */
  static readonly colorSurface: string = '#FFFFFF';
  /** Filled-input and unselected-chip fill. */
  static readonly colorSurfaceMuted: string = '#EAF1FB';
  /** Strongest tonal step; used for pressed/inactive chips. */
  static readonly colorSurfaceStrong: string = '#DCE8F9';

  // --- Navigation rail -----------------------------------------------------
  static readonly colorRail: string = '#0A1B3D';
  static readonly colorRailActive: string = '#165DFF';
  static readonly colorRailText: string = '#C9D6EA';
  static readonly colorRailTextMuted: string = '#7F91B0';

  // --- Text ----------------------------------------------------------------
  static readonly colorTextPrimary: string = '#0A1B3D';
  static readonly colorTextSecondary: string = '#5B6B88';
  static readonly colorTextTertiary: string = '#8A97AD';

  // --- Status --------------------------------------------------------------
  static readonly colorSuccess: string = '#00B42A';
  static readonly colorWarning: string = '#FF7D00';
  static readonly colorDanger: string = '#F53F3F';

  /** Sheet scrim, `rgba(10, 27, 61, 0.45)` expressed as `#AARRGGBB`. */
  static readonly colorScrim: string = '#730A1B3D';
  /** Transparent, so no border call can paint a decorative line. */
  static readonly colorBorder: string = '#00000000';

  // --- Shape ---------------------------------------------------------------
  /** The theme's only border width: none. */
  static readonly borderWidth: number = 0;
  static readonly radiusSm: number = 8;
  static readonly radiusMd: number = 12;
  static readonly radiusLg: number = 16;
  static readonly radiusPill: number = 999;

  // --- Elevation -----------------------------------------------------------
  /** Flat: elevation is expressed as `0`; never call a shadow modifier. */
  static readonly elevationNone: number = 0;
  static readonly shadowRadius: number = 0;
  static readonly shadowOpacity: number = 0;

  // --- Spacing -------------------------------------------------------------
  static readonly spacingXs: number = 4;
  static readonly spacingSm: number = 8;
  static readonly spacingMd: number = 16;
  static readonly spacingLg: number = 24;
  static readonly spacingXl: number = 32;

  // --- Typography ----------------------------------------------------------
  static readonly fontCaption: number = 12;
  static readonly fontBody: number = 14;
  static readonly fontSubtitle: number = 16;
  static readonly fontTitle: number = 20;
  static readonly fontDisplay: number = 24;

  // --- Focus ---------------------------------------------------------------
  static readonly colorFocusOutline: string = '#165DFF';
  static readonly focusOutlineWidth: number = 2;
  /** Cross-client parity value; ArkUI paints the outline at the node edge. */
  static readonly focusOutlineOffset: number = 2;

  // --- Motion --------------------------------------------------------------
  static readonly durationFastMs: number = 120;
  static readonly durationBaseMs: number = 200;

  // --- Layout --------------------------------------------------------------
  /** Minimum touch target (`APP_HARMONY_NATIVE_UI_SPEC.md` section 5). */
  static readonly minTouchTarget: number = 44;
  /** Bottom tab bar height; comfortably above the 44vp target. */
  static readonly tabBarHeight: number = 64;
}

/** Semantic colour roles resolved by `agentsHarmonyColor`. */
export type AgentsHarmonyColorRole =
  | 'primary'
  | 'primaryHover'
  | 'primaryPressed'
  | 'primarySubtle'
  | 'onPrimary'
  | 'background'
  | 'surface'
  | 'surfaceMuted'
  | 'surfaceStrong'
  | 'rail'
  | 'railActive'
  | 'railText'
  | 'railTextMuted'
  | 'textPrimary'
  | 'textSecondary'
  | 'textTertiary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'scrim'
  | 'border'
  | 'focusOutline';

/** Corner steps available to surfaces and controls. */
export type AgentsHarmonyRadiusSize = 'sm' | 'md' | 'lg' | 'pill';

/** Spacing steps for padding, margin, and gaps. */
export type AgentsHarmonySpacingStep = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Resolves a semantic colour role to the theme colour.
 *
 * Pages should prefer the named `color*` constants; this resolver exists for
 * role-driven surfaces (for example a card whose tone comes from data) so a role
 * can be passed as a plain string instead of a hex literal.
 */
export function agentsHarmonyColor(role: AgentsHarmonyColorRole): string {
  switch (role) {
    case 'primary':
      return SdkworkAgentsHarmonyTokens.colorPrimary;
    case 'primaryHover':
      return SdkworkAgentsHarmonyTokens.colorPrimaryHover;
    case 'primaryPressed':
      return SdkworkAgentsHarmonyTokens.colorPrimaryPressed;
    case 'primarySubtle':
      return SdkworkAgentsHarmonyTokens.colorPrimarySubtle;
    case 'onPrimary':
      return SdkworkAgentsHarmonyTokens.colorOnPrimary;
    case 'background':
      return SdkworkAgentsHarmonyTokens.colorBackground;
    case 'surface':
      return SdkworkAgentsHarmonyTokens.colorSurface;
    case 'surfaceMuted':
      return SdkworkAgentsHarmonyTokens.colorSurfaceMuted;
    case 'surfaceStrong':
      return SdkworkAgentsHarmonyTokens.colorSurfaceStrong;
    case 'rail':
      return SdkworkAgentsHarmonyTokens.colorRail;
    case 'railActive':
      return SdkworkAgentsHarmonyTokens.colorRailActive;
    case 'railText':
      return SdkworkAgentsHarmonyTokens.colorRailText;
    case 'railTextMuted':
      return SdkworkAgentsHarmonyTokens.colorRailTextMuted;
    case 'textPrimary':
      return SdkworkAgentsHarmonyTokens.colorTextPrimary;
    case 'textSecondary':
      return SdkworkAgentsHarmonyTokens.colorTextSecondary;
    case 'textTertiary':
      return SdkworkAgentsHarmonyTokens.colorTextTertiary;
    case 'success':
      return SdkworkAgentsHarmonyTokens.colorSuccess;
    case 'warning':
      return SdkworkAgentsHarmonyTokens.colorWarning;
    case 'danger':
      return SdkworkAgentsHarmonyTokens.colorDanger;
    case 'scrim':
      return SdkworkAgentsHarmonyTokens.colorScrim;
    case 'border':
      return SdkworkAgentsHarmonyTokens.colorBorder;
    case 'focusOutline':
      return SdkworkAgentsHarmonyTokens.colorFocusOutline;
    default:
      return SdkworkAgentsHarmonyTokens.colorTextPrimary;
  }
}

/** Resolves a corner step (`8 / 12 / 16 / 999`). */
export function agentsHarmonyRadius(size: AgentsHarmonyRadiusSize): number {
  switch (size) {
    case 'sm':
      return SdkworkAgentsHarmonyTokens.radiusSm;
    case 'md':
      return SdkworkAgentsHarmonyTokens.radiusMd;
    case 'lg':
      return SdkworkAgentsHarmonyTokens.radiusLg;
    case 'pill':
      return SdkworkAgentsHarmonyTokens.radiusPill;
    default:
      return SdkworkAgentsHarmonyTokens.radiusMd;
  }
}

/** Resolves a spacing step (`4 / 8 / 16 / 24 / 32`). */
export function agentsHarmonySpacing(step: AgentsHarmonySpacingStep): number {
  switch (step) {
    case 'xs':
      return SdkworkAgentsHarmonyTokens.spacingXs;
    case 'sm':
      return SdkworkAgentsHarmonyTokens.spacingSm;
    case 'md':
      return SdkworkAgentsHarmonyTokens.spacingMd;
    case 'lg':
      return SdkworkAgentsHarmonyTokens.spacingLg;
    case 'xl':
      return SdkworkAgentsHarmonyTokens.spacingXl;
    default:
      return SdkworkAgentsHarmonyTokens.spacingMd;
  }
}

/**
 * Outline width for a focus ring: 2vp when focused, 0 when not.
 *
 * ArkUI focus is expressed with `outline`, never with a border, so the theme can
 * keep `borderWidth` at 0 and still show a visible focus state.
 */
export function agentsHarmonyFocusOutlineWidth(focused: boolean): number {
  return focused ? SdkworkAgentsHarmonyTokens.focusOutlineWidth : 0;
}

/** Fill for an unselected chip/segmented control. */
export function agentsHarmonyUnselectedFill(): string {
  return SdkworkAgentsHarmonyTokens.colorSurfaceMuted;
}

/** Fill for a selected chip/segmented control. */
export function agentsHarmonySelectedFill(): string {
  return SdkworkAgentsHarmonyTokens.colorPrimary;
}

/** Label colour paired with `agentsHarmonySelectedFill`. */
export function agentsHarmonySelectedLabel(): string {
  return SdkworkAgentsHarmonyTokens.colorOnPrimary;
}

/** Label colour paired with `agentsHarmonyUnselectedFill`. */
export function agentsHarmonyUnselectedLabel(): string {
  return SdkworkAgentsHarmonyTokens.colorTextPrimary;
}
