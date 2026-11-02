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

/** Router entry for `app.agents.library.list`. */
@Builder
export function LibraryPageBuilder() {
  LibraryPage();
}

/** File library page (`app.agents.library.list`). */
@Entry
@Component
export struct LibraryPage {
  private navigator: AgentsHarmonyNavigator = getAgentsHarmonyNavigator();

  build() {
    Column() {
      AgentsPageHeader({
        title: agentsShellMessage('agents.mobile.tab.library'),
        showProfileAction: false,
        showBackAction: true,
        backAccessibilityText: agentsShellMessage('agents.mobile.tab.library'),
        onBackTap: () => {
          this.navigator.back();
        },
      })
      EmptyState({
        message: agentsShellMessage('agents.shell.navigation.notDelivered'),
        detail: agentsShellMessage('agents.mobile.tab.library'),
      })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
  }
}
