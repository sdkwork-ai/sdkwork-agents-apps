import {
  AgentsPageHeader,
  EmptyState,
  LoadingState,
  SdkworkAgentsHarmonyTokens,
  agentsHarmonyFocusOutlineWidth,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import {
  type AgentsAppSdkClient,
  type AgentsPageSnapshot,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';
import {
  AGENTS_HARMONY_PROFILE_ENTRY_ROUTE_ID,
  agentsShellMessage,
  type AgentsHarmonyNavigator,
} from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { agentsMessage } from '../../i18n/AgentsMessages';
import { type AgentsConversationMessage } from '../../models/AgentModels';
import { ConversationViewModel } from '../../presentation/viewModels/ConversationViewModel';
import { ConversationService } from '../../services/ConversationService';

/**
 * Conversation chat page (`app.agents.conversation.chat`, bottom tab 1).
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` sections 4 and 5. The transcript
 * comes from the injected app SDK port; the composer is disabled with a
 * localized explanation while this root has no adapted conversation transport,
 * so the surface never shows an invented transcript or a dead send button
 * without a reason.
 *
 * Theme: `specs/client-theme.spec.json` — assistant bubbles are white
 * `colorSurface` on the `colorBackground` page, user bubbles are `colorPrimary`
 * with `colorOnPrimary` text, and the composer is a white surface with a filled
 * `colorSurfaceMuted` input. No top divider, no shadow, no gradient.
 */
@Component
export struct ConversationPage {
  navigator: AgentsHarmonyNavigator | null = null;
  client: AgentsAppSdkClient | null = null;
  /** Set by the M2 history surface; empty for a new conversation. */
  sessionId: string = '';
  agentId: string = '';

  @State pageState: string = 'loading';
  @State messages: AgentsConversationMessage[] = [];
  @State messageKey: string = '';
  @State noticeKey: string = '';
  @State draft: string = '';
  @State sendingEnabled: boolean = false;
  /** Focus state for the composer send action. */
  @State sendFocused: boolean = false;
  private viewModel: ConversationViewModel = new ConversationViewModel(new ConversationService(null));

  aboutToAppear(): void {
    const service: ConversationService = new ConversationService(this.client);
    this.viewModel = new ConversationViewModel(service);
    this.sendingEnabled = service.canSend();
    this.reload();
  }

  private async reload(): Promise<void> {
    this.pageState = 'loading';
    this.noticeKey = '';
    const snapshot: AgentsPageSnapshot<AgentsConversationMessage> = await this.viewModel.load(
      this.sessionId.length > 0 ? this.sessionId : undefined,
    );
    this.messages = snapshot.items;
    this.messageKey = snapshot.messageKey ?? '';
    this.pageState = snapshot.state;
  }

  private async send(): Promise<void> {
    const text: string = this.draft.trim();
    if (text.length === 0) {
      this.noticeKey = 'agents.conversation.emptyPrompt';
      return;
    }
    const snapshot: AgentsPageSnapshot<AgentsConversationMessage> = await this.viewModel.send(
      this.sessionId,
      text,
    );
    if (snapshot.state === 'ready') {
      this.messages = this.messages.concat(snapshot.items);
      this.draft = '';
      this.noticeKey = '';
      return;
    }
    this.noticeKey = snapshot.messageKey ?? 'agents.conversation.sendFailed';
  }

  private openProfile(): void {
    const navigator: AgentsHarmonyNavigator | null = this.navigator;
    if (navigator !== null) {
      navigator.open(AGENTS_HARMONY_PROFILE_ENTRY_ROUTE_ID);
    }
  }

  build() {
    Column() {
      AgentsPageHeader({
        title: agentsMessage('agents.conversation.title'),
        profileGlyph: agentsShellMessage('agents.shell.profileActionGlyph'),
        profileAccessibilityText: agentsShellMessage('agents.shell.profileAction'),
        showProfileAction: true,
        onProfileTap: () => {
          this.openProfile();
        },
      })
      if (this.pageState === 'loading') {
        LoadingState({ message: agentsMessage('agents.conversation.loading') })
      } else if (this.pageState === 'unavailable' || this.pageState === 'unauthenticated'
        || this.pageState === 'error') {
        EmptyState({
          message: agentsMessage(this.messageKey),
          actionLabel: agentsMessage('agents.conversation.retry'),
          actionAccessibilityText: agentsMessage('agents.conversation.retry'),
          onAction: () => {
            this.reload();
          },
        })
      } else if (this.pageState === 'empty') {
        EmptyState({ message: agentsMessage('agents.conversation.empty') })
      } else {
        List({ space: SdkworkAgentsHarmonyTokens.spacingSm }) {
          ForEach(this.messages, (message: AgentsConversationMessage) => {
            ListItem() {
              Row() {
                Text(message.text)
                  .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
                  .fontColor(message.role === 'user'
                    ? SdkworkAgentsHarmonyTokens.colorOnPrimary
                    : SdkworkAgentsHarmonyTokens.colorTextPrimary)
              }
              .width('100%')
              .justifyContent(message.role === 'user' ? FlexAlign.End : FlexAlign.Start)
              .padding(SdkworkAgentsHarmonyTokens.spacingMd)
              .backgroundColor(message.role === 'user'
                ? SdkworkAgentsHarmonyTokens.colorPrimary
                : SdkworkAgentsHarmonyTokens.colorSurface)
              .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
            }
          }, (message: AgentsConversationMessage) => message.id)
        }
        .width('100%')
        .layoutWeight(1)
        .padding({
          left: SdkworkAgentsHarmonyTokens.spacingMd,
          right: SdkworkAgentsHarmonyTokens.spacingMd,
          top: SdkworkAgentsHarmonyTokens.spacingMd,
        })
        .scrollBar(BarState.Off)
      }
      if (this.noticeKey.length > 0) {
        Text(agentsMessage(this.noticeKey))
          .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
          .fontColor(SdkworkAgentsHarmonyTokens.colorDanger)
          .width('100%')
          .padding({
            left: SdkworkAgentsHarmonyTokens.spacingMd,
            right: SdkworkAgentsHarmonyTokens.spacingMd,
            top: SdkworkAgentsHarmonyTokens.spacingXs,
          })
          .accessibilityText(agentsMessage(this.noticeKey))
      }
      Row({ space: SdkworkAgentsHarmonyTokens.spacingSm }) {
        TextInput({
          text: this.draft,
          placeholder: agentsMessage('agents.conversation.composerPlaceholder'),
        })
          .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
          .layoutWeight(1)
          .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
          .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
          .placeholderColor(SdkworkAgentsHarmonyTokens.colorTextTertiary)
          .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurfaceMuted)
          .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
          .padding({ left: SdkworkAgentsHarmonyTokens.spacingMd, right: SdkworkAgentsHarmonyTokens.spacingMd })
          .enabled(this.sendingEnabled)
          .onChange((value: string) => {
            this.draft = value;
          })
        Button(agentsMessage('agents.conversation.send'))
          .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
          .constraintSize({ minWidth: SdkworkAgentsHarmonyTokens.minTouchTarget })
          .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
          .fontWeight(FontWeight.Medium)
          .fontColor(SdkworkAgentsHarmonyTokens.colorOnPrimary)
          .backgroundColor(SdkworkAgentsHarmonyTokens.colorPrimary)
          .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
          .padding({ left: SdkworkAgentsHarmonyTokens.spacingMd, right: SdkworkAgentsHarmonyTokens.spacingMd })
          .outline({
            width: agentsHarmonyFocusOutlineWidth(this.sendFocused),
            color: SdkworkAgentsHarmonyTokens.colorFocusOutline,
            radius: SdkworkAgentsHarmonyTokens.radiusMd,
          })
          .onFocus(() => {
            this.sendFocused = true;
          })
          .onBlur(() => {
            this.sendFocused = false;
          })
          .enabled(this.sendingEnabled)
          .accessibilityText(agentsMessage('agents.conversation.sendAccessibility'))
          .onClick(() => {
            this.send();
          })
      }
      .width('100%')
      .padding(SdkworkAgentsHarmonyTokens.spacingMd)
      .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
      .alignItems(VerticalAlign.Center)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
  }
}
