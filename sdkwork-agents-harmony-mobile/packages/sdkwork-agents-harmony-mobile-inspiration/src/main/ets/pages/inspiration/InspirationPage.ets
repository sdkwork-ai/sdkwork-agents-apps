import {
  AgentsPageHeader,
  EmptyState,
  LoadingState,
  SdkworkAgentsHarmonyTokens,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import {
  type AgentsPageSnapshot,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';
import {
  AGENTS_HARMONY_PROFILE_ENTRY_ROUTE_ID,
  agentsShellMessage,
  type AgentsHarmonyNavigator,
} from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { inspirationMessage } from '../../i18n/InspirationMessages';
import { type InspirationCard } from '../../models/InspirationModels';
import { InspirationService } from '../../services/InspirationService';

/**
 * Inspiration discover page (`app.agents.inspiration.discover`, bottom tab 2).
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 5 — loading, empty, error,
 * unavailable, and retry states are all implemented and localized. The feed
 * transport gap is reported as `unavailable`, never as empty content
 * (`docs/engineering/plans/PLAN-2026-1102-client-page-parity.md` section 6).
 *
 * Theme: `specs/client-theme.spec.json` — inspiration cards are white
 * `colorSurface` tiles with `radiusLg` on the `colorBackground` page; title,
 * author, and prompt use the primary/secondary/tertiary text ramp. No border,
 * shadow, or gradient.
 */
@Component
export struct InspirationPage {
  navigator: AgentsHarmonyNavigator | null = null;

  @State pageState: string = 'loading';
  @State cards: InspirationCard[] = [];
  @State messageKey: string = '';
  private service: InspirationService = new InspirationService();

  aboutToAppear(): void {
    this.reload();
  }

  private async reload(): Promise<void> {
    this.pageState = 'loading';
    const snapshot: AgentsPageSnapshot<InspirationCard> = await this.service.loadFeed();
    this.cards = snapshot.items;
    this.messageKey = snapshot.messageKey ?? '';
    this.pageState = snapshot.state;
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
        title: inspirationMessage('agents.inspiration.title'),
        profileGlyph: agentsShellMessage('agents.shell.profileActionGlyph'),
        profileAccessibilityText: agentsShellMessage('agents.shell.profileAction'),
        showProfileAction: true,
        onProfileTap: () => {
          this.openProfile();
        },
      })
      if (this.pageState === 'loading') {
        LoadingState({ message: inspirationMessage('agents.inspiration.loading') })
      } else if (this.pageState === 'unavailable' || this.pageState === 'error') {
        EmptyState({
          message: inspirationMessage(this.messageKey),
          actionLabel: inspirationMessage('agents.inspiration.retry'),
          actionAccessibilityText: inspirationMessage('agents.inspiration.retry'),
          onAction: () => {
            this.reload();
          },
        })
      } else if (this.pageState === 'empty') {
        EmptyState({ message: inspirationMessage('agents.inspiration.empty') })
      } else {
        List({ space: SdkworkAgentsHarmonyTokens.spacingMd }) {
          ForEach(this.cards, (card: InspirationCard) => {
            ListItem() {
              Column() {
                Text(card.title)
                  .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
                  .fontWeight(FontWeight.Medium)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
                Text(card.author)
                  .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
                  .margin({ top: SdkworkAgentsHarmonyTokens.spacingXs })
                Text(card.prompt)
                  .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextTertiary)
                  .maxLines(3)
                  .textOverflow({ overflow: TextOverflow.Ellipsis })
                  .margin({ top: SdkworkAgentsHarmonyTokens.spacingSm })
              }
              .width('100%')
              .alignItems(HorizontalAlign.Start)
              .padding(SdkworkAgentsHarmonyTokens.spacingMd)
              .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
              .borderRadius(SdkworkAgentsHarmonyTokens.radiusLg)
            }
          }, (card: InspirationCard) => card.id)
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
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
  }
}
