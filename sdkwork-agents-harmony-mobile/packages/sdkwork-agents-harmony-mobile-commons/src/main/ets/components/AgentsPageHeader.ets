import {
  SdkworkAgentsHarmonyTokens,
  agentsHarmonyFocusOutlineWidth,
} from '../theme/DesignTokens';

/**
 * Domain-neutral page header with the shared profile action.
 *
 * Authority: `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 3 (every mobile
 * tab exposes the profile entry), `APP_HARMONY_NATIVE_UI_SPEC.md` section 5
 * (44vp minimum targets, accessible labels for icon-only controls), and
 * `specs/client-theme.spec.json` (white header surface, no 1px divider, blue
 * profile entry, focus shown with an outline instead of a border).
 *
 * The component owns no copy: the label, glyph, and accessible name are injected
 * by the owning capability package so each package keeps its own i18n fragment.
 *
 * The header is separated from the page by tonal fill only: `colorSurface` on
 * `colorBackground`. There is no bottom border and no shadow, and the controls
 * draw a 2vp `colorFocusOutline` ring when they hold focus.
 */
@Component
export struct AgentsPageHeader {
  @Prop title: string = '';
  /** Short glyph rendered inside the circular profile action. */
  @Prop profileGlyph: string = '';
  /** Accessible name of the profile action; required for the icon-sized control. */
  @Prop profileAccessibilityText: string = '';
  @Prop showProfileAction: boolean = true;
  @Prop showBackAction: boolean = false;
  @Prop backAccessibilityText: string = '';
  onProfileTap: () => void = () => {
  };
  onBackTap: () => void = () => {
  };

  /** Focus state for the visible focus ring (icon-only controls). */
  @State backFocused: boolean = false;
  @State profileFocused: boolean = false;

  build() {
    Row() {
      if (this.showBackAction) {
        Button() {
          Text('‹')
            .fontSize(SdkworkAgentsHarmonyTokens.fontTitle)
            .fontColor(SdkworkAgentsHarmonyTokens.colorPrimary)
        }
        .type(ButtonType.Circle)
        .backgroundColor(SdkworkAgentsHarmonyTokens.colorPrimarySubtle)
        .width(SdkworkAgentsHarmonyTokens.minTouchTarget)
        .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
        .accessibilityText(this.backAccessibilityText)
        .outline({
          width: agentsHarmonyFocusOutlineWidth(this.backFocused),
          color: SdkworkAgentsHarmonyTokens.colorFocusOutline,
          radius: SdkworkAgentsHarmonyTokens.radiusPill,
        })
        .onFocus(() => {
          this.backFocused = true;
        })
        .onBlur(() => {
          this.backFocused = false;
        })
        .onClick(() => {
          this.onBackTap();
        })
      }
      Text(this.title)
        .fontSize(SdkworkAgentsHarmonyTokens.fontTitle)
        .fontWeight(FontWeight.Bold)
        .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
        .layoutWeight(1)
        .margin({ left: this.showBackAction ? 0 : SdkworkAgentsHarmonyTokens.spacingXs })
      if (this.showProfileAction) {
        Button() {
          Text(this.profileGlyph)
            .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
            .fontColor(SdkworkAgentsHarmonyTokens.colorOnPrimary)
        }
        .type(ButtonType.Circle)
        .backgroundColor(SdkworkAgentsHarmonyTokens.colorPrimary)
        .width(SdkworkAgentsHarmonyTokens.minTouchTarget)
        .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
        .accessibilityText(this.profileAccessibilityText)
        .outline({
          width: agentsHarmonyFocusOutlineWidth(this.profileFocused),
          color: SdkworkAgentsHarmonyTokens.colorFocusOutline,
          radius: SdkworkAgentsHarmonyTokens.radiusPill,
        })
        .onFocus(() => {
          this.profileFocused = true;
        })
        .onBlur(() => {
          this.profileFocused = false;
        })
        .onClick(() => {
          this.onProfileTap();
        })
      }
    }
    .width('100%')
    .height(SdkworkAgentsHarmonyTokens.minTouchTarget + SdkworkAgentsHarmonyTokens.spacingSm)
    .alignItems(VerticalAlign.Center)
    .padding({
      left: SdkworkAgentsHarmonyTokens.spacingMd,
      right: SdkworkAgentsHarmonyTokens.spacingMd,
      top: SdkworkAgentsHarmonyTokens.spacingXs,
      bottom: SdkworkAgentsHarmonyTokens.spacingXs,
    })
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
  }
}
