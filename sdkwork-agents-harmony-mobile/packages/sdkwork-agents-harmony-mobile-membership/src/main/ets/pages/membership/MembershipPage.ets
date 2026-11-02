import {
  AgentsPageHeader,
  EmptyState,
  LoadingState,
  SdkworkAgentsHarmonyTokens,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import { type AgentsPageSnapshot } from '@sdkwork/sdkwork-agents-harmony-mobile-core';
import {
  agentsShellMessage,
  getAgentsHarmonyNavigator,
  type AgentsHarmonyNavigator,
} from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { membershipMessage } from '../i18n/MembershipMessages';
import {
  type MembershipCheckoutResult,
  type MembershipPlan,
  type MembershipSummary,
} from '../models/MembershipModels';
import { MembershipService } from '../services/MembershipService';

/**
 * Router entry for `app.agents.membership.catalog`.
 *
 * The platform router instantiates this builder from the package
 * `route_map.json` entry named after the canonical route id.
 */
@Builder
export function MembershipPageBuilder() {
  MembershipPage();
}

/**
 * Membership catalog page (`app.agents.membership.catalog`).
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 5 and
 * `docs/engineering/plans/PLAN-2026-1102-client-page-parity.md` section 6. Plan,
 * summary, and checkout all report the explicit `unavailable` state with retry;
 * no plan, price, or benefit is fabricated. The page is router-instantiated, so
 * it resolves the shell navigator rather than receiving props.
 *
 * Theme: `specs/client-theme.spec.json` — plan cards are white `colorSurface`
 * tiles with `radiusLg` on the `colorBackground` page and the checkout action is
 * a tonal `colorPrimarySubtle` control with `colorPrimary` label, so the page has
 * one accent and no card border, shadow, or gradient.
 */
@Entry
@Component
export struct MembershipPage {
  @State pageState: string = 'loading';
  @State plans: MembershipPlan[] = [];
  @State messageKey: string = '';
  @State summaryState: string = 'loading';
  @State summaryMessageKey: string = '';
  @State noticeKey: string = '';
  private service: MembershipService = new MembershipService();
  private navigator: AgentsHarmonyNavigator = getAgentsHarmonyNavigator();

  aboutToAppear(): void {
    this.reload();
  }

  private async reload(): Promise<void> {
    this.pageState = 'loading';
    this.summaryState = 'loading';
    const plans: AgentsPageSnapshot<MembershipPlan> = await this.service.loadPlans();
    this.plans = plans.items;
    this.messageKey = plans.messageKey ?? '';
    this.pageState = plans.state;

    const summary: AgentsPageSnapshot<MembershipSummary> = await this.service.loadSummary();
    this.summaryMessageKey = summary.messageKey ?? '';
    this.summaryState = summary.state;
  }

  private async checkout(planId: string): Promise<void> {
    const result: MembershipCheckoutResult = await this.service.startCheckout(planId);
    this.noticeKey = result.messageKey;
  }

  build() {
    Column() {
      AgentsPageHeader({
        title: membershipMessage('agents.membership.title'),
        profileGlyph: agentsShellMessage('agents.shell.profileActionGlyph'),
        profileAccessibilityText: agentsShellMessage('agents.shell.profileAction'),
        showBackAction: true,
        backAccessibilityText: membershipMessage('agents.membership.back'),
        showProfileAction: false,
        onBackTap: () => {
          this.navigator.back();
        },
      })
      Scroll() {
        Column() {
          Text(membershipMessage('agents.membership.summaryTitle'))
            .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
            .fontWeight(FontWeight.Medium)
            .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
            .width('100%')
          if (this.summaryState === 'loading') {
            LoadingState({ message: membershipMessage('agents.membership.loading') })
          } else {
            EmptyState({
              message: this.summaryMessageKey.length > 0
                ? membershipMessage(this.summaryMessageKey)
                : membershipMessage('agents.membership.summaryUnavailable'),
              actionLabel: membershipMessage('agents.membership.retry'),
              actionAccessibilityText: membershipMessage('agents.membership.retry'),
              onAction: () => {
                this.reload();
              },
            })
          }
          Text(membershipMessage('agents.membership.plansTitle'))
            .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
            .fontWeight(FontWeight.Medium)
            .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
            .width('100%')
            .margin({ top: SdkworkAgentsHarmonyTokens.spacingLg })
          if (this.pageState === 'loading') {
            LoadingState({ message: membershipMessage('agents.membership.loading') })
          } else if (this.pageState === 'unavailable' || this.pageState === 'error') {
            EmptyState({
              message: membershipMessage(this.messageKey),
              actionLabel: membershipMessage('agents.membership.retry'),
              actionAccessibilityText: membershipMessage('agents.membership.retry'),
              onAction: () => {
                this.reload();
              },
            })
          } else if (this.pageState === 'empty') {
            EmptyState({ message: membershipMessage('agents.membership.empty') })
          } else {
            Column({ space: SdkworkAgentsHarmonyTokens.spacingSm }) {
              ForEach(this.plans, (plan: MembershipPlan) => {
                Column() {
                  Text(plan.name)
                    .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
                    .fontWeight(FontWeight.Medium)
                    .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
                    .width('100%')
                  Text(`${plan.priceLabel} / ${plan.periodLabel}`)
                    .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
                    .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
                    .width('100%')
                    .margin({ top: SdkworkAgentsHarmonyTokens.spacingXs })
                  Button(membershipMessage('agents.membership.checkout'))
                    .width('100%')
                    .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
                    .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
                    .fontWeight(FontWeight.Medium)
                    .fontColor(SdkworkAgentsHarmonyTokens.colorPrimary)
                    .backgroundColor(SdkworkAgentsHarmonyTokens.colorPrimarySubtle)
                    .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
                    .margin({ top: SdkworkAgentsHarmonyTokens.spacingMd })
                    .onClick(() => {
                      this.checkout(plan.id);
                    })
                }
                .width('100%')
                .padding(SdkworkAgentsHarmonyTokens.spacingMd)
                .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
                .borderRadius(SdkworkAgentsHarmonyTokens.radiusLg)
                .alignItems(HorizontalAlign.Start)
              }, (plan: MembershipPlan) => plan.id)
            }
            .width('100%')
          }
          if (this.noticeKey.length > 0) {
            Text(membershipMessage(this.noticeKey))
              .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
              .fontColor(SdkworkAgentsHarmonyTokens.colorDanger)
              .width('100%')
              .margin({ top: SdkworkAgentsHarmonyTokens.spacingSm })
              .accessibilityText(membershipMessage(this.noticeKey))
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
