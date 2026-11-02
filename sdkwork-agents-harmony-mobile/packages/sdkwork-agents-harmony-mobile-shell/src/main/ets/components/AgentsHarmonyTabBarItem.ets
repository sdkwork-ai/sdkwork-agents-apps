import {
  SdkworkAgentsHarmonyTokens,
  agentsHarmonyFocusOutlineWidth,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';

/**
 * One bottom-tab bar entry.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 5 — phone-first, touch-first
 * tab bar with a minimum 44vp target and an accessible name, and
 * `specs/client-theme.spec.json` (`h5`/`harmony` platform notes: white tab bar,
 * blue active item, flat, no divider or shadow above the bar).
 *
 * Selection is signalled by both a filled/unfilled indicator and colour, so
 * colour is never the only signal. The entry is the custom (non-Button) control
 * of the shell, so it owns its focus ring: a 2vp `colorFocusOutline` outline,
 * never a border.
 */
@Component
export struct AgentsHarmonyTabBarItem {
  @Prop label: string = '';
  @Prop selected: boolean = false;
  /** Accessible name announced for this tab. */
  @Prop accessibilityText: string = '';

  /** Focus state for the visible focus ring. */
  @State focused: boolean = false;

  build() {
    Column() {
      Text(this.selected ? '●' : '○')
        .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
        .fontColor(this.selected
          ? SdkworkAgentsHarmonyTokens.colorPrimary
          : SdkworkAgentsHarmonyTokens.colorTextTertiary)
      Text(this.label)
        .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
        .fontColor(this.selected
          ? SdkworkAgentsHarmonyTokens.colorPrimary
          : SdkworkAgentsHarmonyTokens.colorTextSecondary)
        .fontWeight(this.selected ? FontWeight.Medium : FontWeight.Normal)
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
        .margin({ top: 2 })
    }
    .width('100%')
    .height(SdkworkAgentsHarmonyTokens.tabBarHeight)
    .justifyContent(FlexAlign.Center)
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
    .focusable(true)
    .outline({
      width: agentsHarmonyFocusOutlineWidth(this.focused),
      color: SdkworkAgentsHarmonyTokens.colorFocusOutline,
      radius: SdkworkAgentsHarmonyTokens.radiusSm,
    })
    .onFocus(() => {
      this.focused = true;
    })
    .onBlur(() => {
      this.focused = false;
    })
    .accessibilityGroup(true)
    .accessibilityText(this.accessibilityText)
  }
}
