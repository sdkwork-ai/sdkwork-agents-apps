import {
  SdkworkAgentsHarmonyTokens,
  agentsHarmonyFocusOutlineWidth,
  agentsHarmonySelectedFill,
  agentsHarmonySelectedLabel,
  agentsHarmonyUnselectedFill,
  agentsHarmonyUnselectedLabel,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';

/**
 * Selectable chip used by the creative studio modality/aspect pickers.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 5 — 44vp minimum target and
 * a selection signal that is not colour-only (the font weight changes with
 * selection as well), plus `specs/client-theme.spec.json`: flat fill, no 1px
 * chip border, `radiusPill` corners, and a 2vp `colorFocusOutline` focus ring.
 *
 * Selection is passed in as a `@Prop`, so switching chips updates the existing
 * nodes instead of relying on a builder to be re-created.
 */
@Component
export struct CreativeOptionChip {
  @Prop label: string = '';
  @Prop selected: boolean = false;
  onSelect: () => void = () => {
  };

  /** Focus state for the visible focus ring. */
  @State focused: boolean = false;

  build() {
    Button(this.label)
      .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
      .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
      .fontWeight(this.selected ? FontWeight.Medium : FontWeight.Normal)
      .fontColor(this.selected
        ? agentsHarmonySelectedLabel()
        : agentsHarmonyUnselectedLabel())
      .backgroundColor(this.selected
        ? agentsHarmonySelectedFill()
        : agentsHarmonyUnselectedFill())
      .borderRadius(SdkworkAgentsHarmonyTokens.radiusPill)
      .padding({
        left: SdkworkAgentsHarmonyTokens.spacingMd,
        right: SdkworkAgentsHarmonyTokens.spacingMd,
      })
      .margin({ right: SdkworkAgentsHarmonyTokens.spacingSm, bottom: SdkworkAgentsHarmonyTokens.spacingSm })
      .outline({
        width: agentsHarmonyFocusOutlineWidth(this.focused),
        color: SdkworkAgentsHarmonyTokens.colorFocusOutline,
        radius: SdkworkAgentsHarmonyTokens.radiusPill,
      })
      .onFocus(() => {
        this.focused = true;
      })
      .onBlur(() => {
        this.focused = false;
      })
      .accessibilityText(this.label)
      .onClick(() => {
        this.onSelect();
      })
  }
}
