import { SdkworkAgentsHarmonyTokens } from '../theme/DesignTokens';

/**
 * Domain-neutral loading and unavailable primitives.
 *
 * `unavailable` is a first-class state: a capability with no adapted SDK
 * transport in this root renders it with a retry action instead of fabricating
 * empty content (`docs/engineering/plans/PLAN-2026-1102-client-page-parity.md`
 * section 6, data honesty).
 */
@Component
export struct LoadingState {
  @Prop message: string = '';

  build() {
    Column() {
      LoadingProgress()
        .width(32)
        .height(32)
        .color(SdkworkAgentsHarmonyTokens.colorPrimary)
      if (this.message.length > 0) {
        Text(this.message)
          .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
          .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
          .margin({ top: SdkworkAgentsHarmonyTokens.spacingSm })
      }
    }
    .width('100%')
    .padding(SdkworkAgentsHarmonyTokens.spacingLg)
    .justifyContent(FlexAlign.Center)
    .accessibilityGroup(true)
    .accessibilityText(this.message)
  }
}
