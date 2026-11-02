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

/** Router entry for `app.agents.conversation.list`. */
@Builder
export function ConversationHistoryBuilder() {
  ConversationHistoryPage();
}

/**
 * Conversation history page (`app.agents.conversation.list`).
 *
 * The Harmony root has no adapted ArkTS conversation transport yet; the page
 * reports the explicit not-delivered state with a retry affordance instead of an
 * invented transcript.
 */
@Entry
@Component
export struct ConversationHistoryPage {
  private navigator: AgentsHarmonyNavigator = getAgentsHarmonyNavigator();

  build() {
    Column() {
      AgentsPageHeader({
        title: agentsShellMessage('agents.mobile.history.title'),
        showProfileAction: false,
        showBackAction: true,
        backAccessibilityText: agentsShellMessage('agents.mobile.history.title'),
        onBackTap: () => {
          this.navigator.back();
        },
      })
      EmptyState({
        message: agentsShellMessage('agents.shell.navigation.notDelivered'),
        detail: agentsShellMessage('agents.mobile.history.title'),
      })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
  }
}
