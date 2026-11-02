import {
  AgentsPageHeader,
  EmptyState,
  LoadingState,
  SdkworkAgentsHarmonyTokens,
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
import { type AgentsCatalogListItem } from '../../models/AgentModels';
import { AgentsCatalogViewModel } from '../../presentation/viewModels/AgentsCatalogViewModel';
import { AgentCatalogService } from '../../services/AgentCatalogService';

/**
 * Agent catalog page (`app.agents.catalog.list`, bottom tab 5).
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` sections 4 and 5 — the page owns UI
 * state, calls a view model/service pair, and receives the SDK client seam plus
 * the shell navigator through injection. Theme: `specs/client-theme.spec.json`
 * — agent cards are white `colorSurface` tiles on the `colorBackground` page,
 * separated by fill and gap rather than by a border or shadow.
 */
@Component
export struct AgentsListPage {
  /** Shell navigation port; null only in isolated preview. */
  navigator: AgentsHarmonyNavigator | null = null;
  /** Injected app SDK port; null means no adapted transport in this root. */
  client: AgentsAppSdkClient | null = null;

  @State pageState: string = 'loading';
  @State items: AgentsCatalogListItem[] = [];
  @State messageKey: string = '';
  private viewModel: AgentsCatalogViewModel =
    new AgentsCatalogViewModel(new AgentCatalogService(null));

  aboutToAppear(): void {
    this.viewModel = new AgentsCatalogViewModel(new AgentCatalogService(this.client));
    this.reload();
  }

  private async reload(): Promise<void> {
    this.pageState = 'loading';
    const snapshot: AgentsPageSnapshot<AgentsCatalogListItem> = await this.viewModel.load(20);
    this.items = snapshot.items;
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
        title: agentsMessage('agents.catalog.title'),
        profileGlyph: agentsShellMessage('agents.shell.profileActionGlyph'),
        profileAccessibilityText: agentsShellMessage('agents.shell.profileAction'),
        showProfileAction: true,
        onProfileTap: () => {
          this.openProfile();
        },
      })
      if (this.pageState === 'loading') {
        LoadingState({ message: agentsMessage('agents.catalog.loading') })
      } else if (this.pageState === 'unavailable' || this.pageState === 'unauthenticated'
        || this.pageState === 'error') {
        EmptyState({
          message: agentsMessage(this.messageKey),
          actionLabel: agentsMessage('agents.catalog.retry'),
          actionAccessibilityText: agentsMessage('agents.catalog.retry'),
          onAction: () => {
            this.reload();
          },
        })
      } else if (this.pageState === 'empty') {
        EmptyState({ message: agentsMessage('agents.catalog.empty') })
      } else {
        List({ space: SdkworkAgentsHarmonyTokens.spacingSm }) {
          ForEach(this.items, (item: AgentsCatalogListItem) => {
            ListItem() {
              Column() {
                Text(item.name)
                  .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
                  .fontWeight(FontWeight.Medium)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
                if (item.description.length > 0) {
                  Text(item.description)
                    .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
                    .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
                    .margin({ top: SdkworkAgentsHarmonyTokens.spacingXs })
                }
              }
              .width('100%')
              .alignItems(HorizontalAlign.Start)
              .padding(SdkworkAgentsHarmonyTokens.spacingMd)
              .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
              .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
            }
          }, (item: AgentsCatalogListItem) => item.id)
        }
        .width('100%')
        .layoutWeight(1)
        .padding({
          left: SdkworkAgentsHarmonyTokens.spacingMd,
          right: SdkworkAgentsHarmonyTokens.spacingMd,
          top: SdkworkAgentsHarmonyTokens.spacingMd,
          bottom: SdkworkAgentsHarmonyTokens.spacingMd,
        })
        .scrollBar(BarState.Off)
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
  }
}
