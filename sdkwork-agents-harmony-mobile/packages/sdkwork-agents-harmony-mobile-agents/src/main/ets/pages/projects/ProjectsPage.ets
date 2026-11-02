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

/** Router entry for `app.agents.projects.list`. */
@Builder
export function ProjectsPageBuilder() {
  ProjectsPage();
}

/** Project list page (`app.agents.projects.list`). */
@Entry
@Component
export struct ProjectsPage {
  private navigator: AgentsHarmonyNavigator = getAgentsHarmonyNavigator();

  build() {
    Column() {
      AgentsPageHeader({
        title: agentsShellMessage('agents.mobile.tab.projects'),
        showProfileAction: false,
        showBackAction: true,
        backAccessibilityText: agentsShellMessage('agents.mobile.tab.projects'),
        onBackTap: () => {
          this.navigator.back();
        },
      })
      EmptyState({
        message: agentsShellMessage('agents.shell.navigation.notDelivered'),
        detail: agentsShellMessage('agents.mobile.tab.projects'),
      })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
  }
}
