import { SdkworkAgentsHarmonyTokens } from '../theme/DesignTokens';

/**
 * Domain-neutral empty/error/unavailable/retry primitive.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 5 — screens must handle
 * loading, empty, permission-denied, offline/unavailable, and unknown-error
 * states. Copy is always injected so feature packages own their own fragments.
 *
 * Theme: `specs/client-theme.spec.json` — the state sits on the page background
 * with no card, border, or shadow; only the retry action carries `#165DFF`.
 */
@Component
export struct EmptyState {
  @Prop message: string = '';
  /** Optional supporting line (for example the transport gap reason). */
  @Prop detail: string = '';
  /** Optional action label; the action renders only when both label and callback exist. */
  @Prop actionLabel: string = '';
  /** Accessible name for the action button. */
  @Prop actionAccessibilityText: string = '';
  onAction: () => void = () => {
  };

  build() {
    Column() {
      Text(this.message)
        .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
        .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
        .textAlign(TextAlign.Center)
      if (this.detail.length > 0) {
        Text(this.detail)
          .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
          .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
          .textAlign(TextAlign.Center)
          .margin({ top: SdkworkAgentsHarmonyTokens.spacingXs })
      }
      if (this.actionLabel.length > 0) {
        Button(this.actionLabel)
          .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
          .fontWeight(FontWeight.Medium)
          .fontColor(SdkworkAgentsHarmonyTokens.colorOnPrimary)
          .backgroundColor(SdkworkAgentsHarmonyTokens.colorPrimary)
          .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
          .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
          .constraintSize({ minWidth: SdkworkAgentsHarmonyTokens.minTouchTarget })
          .padding({ left: SdkworkAgentsHarmonyTokens.spacingMd, right: SdkworkAgentsHarmonyTokens.spacingMd })
          .margin({ top: SdkworkAgentsHarmonyTokens.spacingMd })
          .accessibilityText(this.actionAccessibilityText.length > 0 ? this.actionAccessibilityText : this.actionLabel)
          .onClick(() => {
            this.onAction();
          })
      }
    }
    .width('100%')
    .padding(SdkworkAgentsHarmonyTokens.spacingLg)
    .justifyContent(FlexAlign.Center)
  }
}
