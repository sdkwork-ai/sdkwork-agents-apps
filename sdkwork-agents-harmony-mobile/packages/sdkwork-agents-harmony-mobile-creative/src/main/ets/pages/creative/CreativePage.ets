import {
  AgentsPageHeader,
  EmptyState,
  LoadingState,
  SdkworkAgentsHarmonyTokens,
  agentsHarmonyFocusOutlineWidth,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import { type AgentsPageSnapshot } from '@sdkwork/sdkwork-agents-harmony-mobile-core';
import {
  AGENTS_HARMONY_PROFILE_ENTRY_ROUTE_ID,
  agentsShellMessage,
  type AgentsHarmonyNavigator,
} from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { creativeMessage } from '../../i18n/CreativeMessages';
import { CreativeOptionChip } from '../../components/CreativeOptionChip';
import {
  type CreativeAspectOption,
  type CreativeModalityOption,
  type CreativeResultItem,
  type CreativeSessionSummary,
  type CreativeSubmitResult,
} from '../../models/CreativeModels';
import { CreativeService } from '../../services/CreativeService';

/**
 * Creative studio page (`app.agents.creative.studio`, bottom tab 3).
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 5 — form validation runs
 * before any transport call, duplicate submit is blocked by the in-flight flag,
 * and the missing generations transport is reported as `unavailable` with retry
 * instead of a fabricated queued result.
 *
 * Theme: `specs/client-theme.spec.json` — the prompt field is a filled
 * `colorSurfaceMuted` input with `radiusMd`, session rows and result tiles are
 * white `colorSurface`, and the submit action is the single `colorPrimary`
 * control. No input border, shadow, or gradient.
 */
@Component
export struct CreativePage {
  navigator: AgentsHarmonyNavigator | null = null;

  @State modalities: CreativeModalityOption[] = [];
  @State aspects: CreativeAspectOption[] = [];
  @State modalityId: string = 'image';
  @State aspectId: string = 'square';
  @State prompt: string = '';
  @State noticeKey: string = '';
  @State submitting: boolean = false;
  @State sessionsState: string = 'loading';
  @State sessions: CreativeSessionSummary[] = [];
  @State sessionsMessageKey: string = '';
  @State resultsState: string = 'loading';
  @State results: CreativeResultItem[] = [];
  @State resultsMessageKey: string = '';
  /** Focus state for the submit action. */
  @State submitFocused: boolean = false;
  private service: CreativeService = new CreativeService();

  aboutToAppear(): void {
    this.modalities = this.service.modalities();
    this.aspects = this.service.aspects();
    this.reload();
  }

  private async reload(): Promise<void> {
    this.sessionsState = 'loading';
    this.resultsState = 'loading';
    const sessions: AgentsPageSnapshot<CreativeSessionSummary> = await this.service.loadSessions();
    this.sessions = sessions.items;
    this.sessionsMessageKey = sessions.messageKey ?? '';
    this.sessionsState = sessions.state;

    const activeSession: string = this.sessions.length > 0 ? this.sessions[0].id : '';
    const results: AgentsPageSnapshot<CreativeResultItem> = await this.service.loadResults(activeSession);
    this.results = results.items;
    this.resultsMessageKey = results.messageKey ?? '';
    this.resultsState = results.state;
  }

  private async submit(): Promise<void> {
    if (this.submitting) {
      return;
    }
    this.submitting = true;
    const result: CreativeSubmitResult = await this.service.submit(
      this.prompt,
      this.modalityId,
      this.aspectId,
    );
    this.noticeKey = result.messageKey;
    this.submitting = false;
    if (result.state === 'submitted') {
      this.prompt = '';
      this.reload();
    }
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
        title: creativeMessage('agents.creative.title'),
        profileGlyph: agentsShellMessage('agents.shell.profileActionGlyph'),
        profileAccessibilityText: agentsShellMessage('agents.shell.profileAction'),
        showProfileAction: true,
        onProfileTap: () => {
          this.openProfile();
        },
      })
      Scroll() {
        Column() {
          Text(creativeMessage('agents.creative.promptLabel'))
            .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
            .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
            .width('100%')
            .margin({ bottom: SdkworkAgentsHarmonyTokens.spacingXs })
          TextArea({
            text: this.prompt,
            placeholder: creativeMessage('agents.creative.promptPlaceholder'),
          })
            .height(96)
            .width('100%')
            .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
            .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
            .placeholderColor(SdkworkAgentsHarmonyTokens.colorTextTertiary)
            .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurfaceMuted)
            .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
            .padding(SdkworkAgentsHarmonyTokens.spacingMd)
            .onChange((value: string) => {
              this.prompt = value;
            })
          Text(creativeMessage('agents.creative.modalityLabel'))
            .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
            .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
            .width('100%')
            .margin({ top: SdkworkAgentsHarmonyTokens.spacingMd, bottom: SdkworkAgentsHarmonyTokens.spacingXs })
          Flex({ wrap: FlexWrap.Wrap }) {
            ForEach(this.modalities, (option: CreativeModalityOption) => {
              CreativeOptionChip({
                label: creativeMessage(option.labelKey),
                selected: this.modalityId === option.id,
                onSelect: () => {
                  this.modalityId = option.id;
                },
              })
            }, (option: CreativeModalityOption) => option.id)
          }
          .width('100%')
          Text(creativeMessage('agents.creative.aspectLabel'))
            .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
            .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
            .width('100%')
            .margin({ top: SdkworkAgentsHarmonyTokens.spacingSm, bottom: SdkworkAgentsHarmonyTokens.spacingXs })
          Flex({ wrap: FlexWrap.Wrap }) {
            ForEach(this.aspects, (option: CreativeAspectOption) => {
              CreativeOptionChip({
                label: creativeMessage(option.labelKey),
                selected: this.aspectId === option.id,
                onSelect: () => {
                  this.aspectId = option.id;
                },
              })
            }, (option: CreativeAspectOption) => option.id)
          }
          .width('100%')
          Button(creativeMessage('agents.creative.submit'))
            .width('100%')
            .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
            .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
            .fontWeight(FontWeight.Medium)
            .fontColor(SdkworkAgentsHarmonyTokens.colorOnPrimary)
            .backgroundColor(SdkworkAgentsHarmonyTokens.colorPrimary)
            .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
            .margin({ top: SdkworkAgentsHarmonyTokens.spacingMd })
            .outline({
              width: agentsHarmonyFocusOutlineWidth(this.submitFocused),
              color: SdkworkAgentsHarmonyTokens.colorFocusOutline,
              radius: SdkworkAgentsHarmonyTokens.radiusMd,
            })
            .onFocus(() => {
              this.submitFocused = true;
            })
            .onBlur(() => {
              this.submitFocused = false;
            })
            .enabled(!this.submitting && this.prompt.trim().length > 0)
            .onClick(() => {
              this.submit();
            })
          if (this.noticeKey.length > 0) {
            Text(creativeMessage(this.noticeKey))
              .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
              .fontColor(SdkworkAgentsHarmonyTokens.colorDanger)
              .width('100%')
              .margin({ top: SdkworkAgentsHarmonyTokens.spacingSm })
              .accessibilityText(creativeMessage(this.noticeKey))
          }
          Text(creativeMessage('agents.creative.sessionsTitle'))
            .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
            .fontWeight(FontWeight.Medium)
            .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
            .width('100%')
            .margin({ top: SdkworkAgentsHarmonyTokens.spacingLg, bottom: SdkworkAgentsHarmonyTokens.spacingSm })
          if (this.sessionsState === 'loading') {
            LoadingState({ message: creativeMessage('agents.creative.loading') })
          } else if (this.sessionsState === 'unavailable' || this.sessionsState === 'error') {
            EmptyState({
              message: creativeMessage(this.sessionsMessageKey),
              actionLabel: creativeMessage('agents.creative.retry'),
              actionAccessibilityText: creativeMessage('agents.creative.retry'),
              onAction: () => {
                this.reload();
              },
            })
          } else if (this.sessionsState === 'empty') {
            EmptyState({ message: creativeMessage('agents.creative.empty') })
          } else {
            Column({ space: SdkworkAgentsHarmonyTokens.spacingSm }) {
              ForEach(this.sessions, (session: CreativeSessionSummary) => {
                Text(session.title)
                  .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
                  .width('100%')
                  .padding(SdkworkAgentsHarmonyTokens.spacingMd)
                  .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
                  .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
              }, (session: CreativeSessionSummary) => session.id)
            }
            .width('100%')
          }
          Text(creativeMessage('agents.creative.resultsTitle'))
            .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
            .fontWeight(FontWeight.Medium)
            .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
            .width('100%')
            .margin({ top: SdkworkAgentsHarmonyTokens.spacingLg, bottom: SdkworkAgentsHarmonyTokens.spacingSm })
          if (this.resultsState === 'unavailable' || this.resultsState === 'error') {
            EmptyState({
              message: creativeMessage(this.resultsMessageKey),
              actionLabel: creativeMessage('agents.creative.retry'),
              actionAccessibilityText: creativeMessage('agents.creative.retry'),
              onAction: () => {
                this.reload();
              },
            })
          } else if (this.resultsState === 'empty' || this.resultsState === 'loading') {
            EmptyState({ message: creativeMessage('agents.creative.empty') })
          } else {
            Flex({ wrap: FlexWrap.Wrap }) {
              ForEach(this.results, (result: CreativeResultItem) => {
                Column() {
                  Text(result.kind)
                    .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
                    .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
                }
                .width('48%')
                .height(120)
                .margin({ right: SdkworkAgentsHarmonyTokens.spacingSm, bottom: SdkworkAgentsHarmonyTokens.spacingSm })
                .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
                .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
                .justifyContent(FlexAlign.Center)
              }, (result: CreativeResultItem) => result.id)
            }
            .width('100%')
          }
        }
        .width('100%')
        .padding(SdkworkAgentsHarmonyTokens.spacingMd)
        .alignItems(HorizontalAlign.Start)
      }
      .layoutWeight(1)
      .scrollBar(BarState.Auto)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
  }
}
