import {
  AgentsPageHeader,
  EmptyState,
  SdkworkAgentsHarmonyTokens,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import {
  agentsShellMessage,
  getAgentsHarmonyNavigator,
  type AgentsHarmonyNavigator,
} from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

/** Router entry for `app.agents.assets.detail`. */
@Builder
export function AssetDetailPageBuilder() {
  AssetDetailPage();
}

/**
 * Asset detail page (`app.agents.assets.detail`).
 *
 * The library already renders its detail sheet from the adapted asset service;
 * the standalone route is the deep-link entry and reports the explicit
 * not-delivered state until the detail transport is wired.
 */
@Entry
@Component
export struct AssetDetailPage {
  private navigator: AgentsHarmonyNavigator = getAgentsHarmonyNavigator();

  build() {
    Column() {
      AgentsPageHeader({
        title: agentsShellMessage('agents.mobile.assets.detailTitle'),
        showProfileAction: false,
        showBackAction: true,
        backAccessibilityText: agentsShellMessage('agents.mobile.assets.detailTitle'),
        onBackTap: () => {
          this.navigator.back();
        },
      })
      EmptyState({
        message: agentsShellMessage('agents.shell.navigation.notDelivered'),
        detail: agentsShellMessage('agents.mobile.assets.detailTitle'),
      })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
  }
}
