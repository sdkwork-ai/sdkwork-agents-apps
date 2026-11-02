import {
  AgentsPageHeader,
  EmptyState,
  LoadingState,
  SdkworkAgentsHarmonyTokens,
  agentsHarmonyFocusOutlineWidth,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import { type AgentsPageSnapshot } from '@sdkwork/sdkwork-agents-harmony-mobile-core';
import {
  agentsShellMessage,
  getAgentsHarmonyNavigator,
  type AgentsHarmonyNavigator,
} from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { profileMessage } from '../i18n/ProfileMessages';
import { type ProfileLink, type ProfileSummary } from '../models/ProfileModels';
import { ProfileService } from '../services/ProfileService';

/** Router entry for `app.agents.profile.index`. */
@Builder
export function ProfilePageBuilder() {
  ProfilePage();
}

/**
 * Profile hub page (`app.agents.profile.index`).
 *
 * Authority: `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 3 (the avatar
 * entry opens the profile hub) and `specs/client-page-parity.spec.json`
 * `navigation.mobileProfileLinks`. The summary is real core session state; a
 * link whose screen has not landed yet reports the explicit not-delivered state
 * instead of navigating to a blank page.
 *
 * Theme: `specs/client-theme.spec.json` — the identity summary is a white
 * `colorSurface` card and each link is its own white tile separated by a gap on
 * the `colorBackground` page, so no row rule, border, or shadow is needed. Link
 * rows are custom focusable rows, so they draw the 2vp `colorFocusOutline` ring.
 */
@Entry
@Component
export struct ProfilePage {
  @State pageState: string = 'loading';
  @State messageKey: string = '';
  @State authenticated: boolean = false;
  @State tenantId: string = '';
  @State noticeKey: string = '';
  @State links: ProfileLink[] = [];
  /** Route id of the link row that currently holds focus ('' when none). */
  @State focusedRouteId: string = '';
  private service: ProfileService = new ProfileService();
  private navigator: AgentsHarmonyNavigator = getAgentsHarmonyNavigator();

  aboutToAppear(): void {
    this.links = this.service.links();
    this.reload();
  }

  private async reload(): Promise<void> {
    this.pageState = 'loading';
    this.noticeKey = '';
    const snapshot: AgentsPageSnapshot<ProfileSummary> = await this.service.loadSummary();
    this.messageKey = snapshot.messageKey ?? '';
    if (snapshot.items.length > 0) {
      this.authenticated = snapshot.items[0].authenticated;
      this.tenantId = snapshot.items[0].tenantId;
    } else {
      this.authenticated = false;
      this.tenantId = '';
    }
    this.pageState = snapshot.state;
  }

  private openLink(routeId: string): void {
    const navigator: AgentsHarmonyNavigator = this.navigator;
    if (navigator.canOpen(routeId)) {
      this.noticeKey = '';
      navigator.open(routeId);
      return;
    }
    this.noticeKey = 'agents.profile.link.notDelivered';
  }

  build() {
    Column() {
      AgentsPageHeader({
        title: profileMessage('agents.profile.title'),
        profileGlyph: agentsShellMessage('agents.shell.profileActionGlyph'),
        profileAccessibilityText: agentsShellMessage('agents.shell.profileAction'),
        showProfileAction: false,
        showBackAction: true,
        backAccessibilityText: profileMessage('agents.profile.back'),
        onBackTap: () => {
          this.navigator.back();
        },
      })
      Scroll() {
        Column() {
          if (this.pageState === 'loading') {
            LoadingState({ message: profileMessage('agents.profile.loading') })
          } else if (this.pageState === 'unauthenticated') {
            EmptyState({
              message: profileMessage('agents.profile.signInRequired'),
              actionLabel: profileMessage('agents.profile.retry'),
              actionAccessibilityText: profileMessage('agents.profile.retry'),
              onAction: () => {
                this.reload();
              },
            })
          } else {
            Column() {
              Text(this.authenticated
                ? profileMessage('agents.profile.authenticated')
                : profileMessage('agents.profile.unauthenticated'))
                .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
                .fontWeight(FontWeight.Medium)
                .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
                .width('100%')
              if (this.tenantId.length > 0) {
                Text(`${profileMessage('agents.profile.tenantId')}: ${this.tenantId}`)
                  .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
                  .width('100%')
                  .margin({ top: SdkworkAgentsHarmonyTokens.spacingXs })
              }
            }
            .width('100%')
            .padding(SdkworkAgentsHarmonyTokens.spacingMd)
            .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
            .borderRadius(SdkworkAgentsHarmonyTokens.radiusLg)
            .alignItems(HorizontalAlign.Start)
          }
          Text(profileMessage('agents.profile.linksTitle'))
            .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
            .fontWeight(FontWeight.Medium)
            .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
            .width('100%')
            .margin({ top: SdkworkAgentsHarmonyTokens.spacingLg, bottom: SdkworkAgentsHarmonyTokens.spacingSm })
          Column({ space: SdkworkAgentsHarmonyTokens.spacingSm }) {
            ForEach(this.links, (link: ProfileLink) => {
              Row() {
                Text(profileMessage(link.labelKey))
                  .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
                  .layoutWeight(1)
                Text('›')
                  .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextTertiary)
              }
              .width('100%')
              .height(SdkworkAgentsHarmonyTokens.minTouchTarget + SdkworkAgentsHarmonyTokens.spacingSm)
              .padding({ left: SdkworkAgentsHarmonyTokens.spacingMd, right: SdkworkAgentsHarmonyTokens.spacingMd })
              .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
              .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
              .focusable(true)
              .outline({
                width: agentsHarmonyFocusOutlineWidth(this.focusedRouteId === link.routeId),
                color: SdkworkAgentsHarmonyTokens.colorFocusOutline,
                radius: SdkworkAgentsHarmonyTokens.radiusMd,
              })
              .onFocus(() => {
                this.focusedRouteId = link.routeId;
              })
              .onBlur(() => {
                this.focusedRouteId = '';
              })
              .accessibilityGroup(true)
              .accessibilityText(profileMessage(link.labelKey))
              .onClick(() => {
                this.openLink(link.routeId);
              })
            }, (link: ProfileLink) => link.routeId)
          }
          .width('100%')
          if (this.noticeKey.length > 0) {
            Text(profileMessage(this.noticeKey))
              .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
              .fontColor(SdkworkAgentsHarmonyTokens.colorDanger)
              .width('100%')
              .margin({ top: SdkworkAgentsHarmonyTokens.spacingSm })
              .accessibilityText(profileMessage(this.noticeKey))
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
