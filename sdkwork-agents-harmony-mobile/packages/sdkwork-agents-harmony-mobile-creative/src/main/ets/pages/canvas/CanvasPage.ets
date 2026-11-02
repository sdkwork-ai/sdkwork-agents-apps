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

/** Router entry for `app.agents.canvas.board`. */
@Builder
export function CanvasPageBuilder() {
  CanvasPage();
}

/**
 * Read-only canvas page (`app.agents.canvas.board`).
 *
 * The PC canvas graph is browser-local; the Harmony root has no adapted canvas
 * store, so the route renders the explicit not-delivered state. Editing stays a
 * PC/tablet capability (`PLAN-2026-1102-client-page-parity.md` section 6).
 */
@Entry
@Component
export struct CanvasPage {
  private navigator: AgentsHarmonyNavigator = getAgentsHarmonyNavigator();

  build() {
    Column() {
      AgentsPageHeader({
        title: agentsShellMessage('agents.mobile.tab.canvas'),
        showProfileAction: false,
        showBackAction: true,
        backAccessibilityText: agentsShellMessage('agents.mobile.tab.canvas'),
        onBackTap: () => {
          this.navigator.back();
        },
      })
      EmptyState({
        message: agentsShellMessage('agents.shell.navigation.notDelivered'),
        detail: agentsShellMessage('agents.mobile.tab.canvas'),
      })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
  }
}
