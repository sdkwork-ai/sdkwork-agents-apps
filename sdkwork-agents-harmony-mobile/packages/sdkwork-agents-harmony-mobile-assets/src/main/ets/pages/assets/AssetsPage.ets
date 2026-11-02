import {
  AgentsPageHeader,
  EmptyState,
  LoadingState,
  SdkworkAgentsHarmonyTokens,
  agentsHarmonyFocusOutlineWidth,
  agentsHarmonySelectedFill,
  agentsHarmonySelectedLabel,
  agentsHarmonyUnselectedFill,
  agentsHarmonyUnselectedLabel,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import { type AgentsPageSnapshot } from '@sdkwork/sdkwork-agents-harmony-mobile-core';
import {
  AGENTS_HARMONY_PROFILE_ENTRY_ROUTE_ID,
  agentsShellMessage,
  type AgentsHarmonyNavigator,
} from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { assetsMessage } from '../../i18n/AssetsMessages';
import {
  type AssetDateGroup,
  type AssetItem,
  type AssetKindFilter,
} from '../../models/AssetModels';
import { AssetsService } from '../../services/AssetsService';

/**
 * Asset library page (`app.agents.assets.list`, bottom tab 4).
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 5. The library renders a
 * date-grouped grid with a kind filter and a detail sheet. Because this root has
 * no adapted ArkTS assets transport yet, the page reports the explicit
 * `unavailable` state with retry rather than an empty gallery; the grid and sheet
 * are wired for the rows that arrive once M3 lands.
 *
 * Theme: `specs/client-theme.spec.json` — kind filters are pill chips (blue when
 * selected, `colorSurfaceMuted` when not), rows are white `colorSurface` tiles
 * grouped by a `colorTextTertiary` date header, and the detail sheet is a white
 * surface with `radiusLg` corners and a tonal close action. The sheet mask is the
 * only scrim; there is no border, shadow, or gradient.
 */
@Component
export struct AssetsPage {
  navigator: AgentsHarmonyNavigator | null = null;

  @State kinds: AssetKindFilter[] = [];
  @State kindId: string = 'all';
  @State pageState: string = 'loading';
  @State groups: AssetDateGroup[] = [];
  @State messageKey: string = '';
  @State showDetail: boolean = false;
  @State selectedAssetId: string = '';
  @State selectedAssetTitle: string = '';
  @State selectedAssetAspect: string = '';
  @State selectedAssetResolution: string = '';
  /** Focus state for the sheet close action. */
  @State closeFocused: boolean = false;
  private service: AssetsService = new AssetsService();

  aboutToAppear(): void {
    this.kinds = this.service.kinds();
    this.reload();
  }

  private async reload(): Promise<void> {
    this.pageState = 'loading';
    const snapshot: AgentsPageSnapshot<AssetDateGroup> = await this.service.loadGroups(this.kindId);
    this.groups = snapshot.items;
    this.messageKey = snapshot.messageKey ?? '';
    this.pageState = snapshot.state;
  }

  private openProfile(): void {
    const navigator: AgentsHarmonyNavigator | null = this.navigator;
    if (navigator !== null) {
      navigator.open(AGENTS_HARMONY_PROFILE_ENTRY_ROUTE_ID);
    }
  }

  private openDetail(item: AssetItem): void {
    this.selectedAssetId = item.id;
    this.selectedAssetTitle = item.title;
    this.selectedAssetAspect = item.aspectRatio;
    this.selectedAssetResolution = item.resolution;
    this.showDetail = true;
  }

  @Builder
  detailSheet() {
    Column({ space: SdkworkAgentsHarmonyTokens.spacingSm }) {
      Text(assetsMessage('agents.assets.detailTitle'))
        .fontSize(SdkworkAgentsHarmonyTokens.fontTitle)
        .fontWeight(FontWeight.Bold)
        .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
        .width('100%')
      Text(this.selectedAssetTitle)
        .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
        .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
        .width('100%')
      Text(`${assetsMessage('agents.assets.detail.aspect')}: ${this.selectedAssetAspect}`)
        .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
        .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
        .width('100%')
      Text(`${assetsMessage('agents.assets.detail.resolution')}: ${this.selectedAssetResolution}`)
        .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
        .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
        .width('100%')
      Button(assetsMessage('agents.assets.detail.close'))
        .width('100%')
        .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
        .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
        .fontWeight(FontWeight.Medium)
        .fontColor(SdkworkAgentsHarmonyTokens.colorPrimary)
        .backgroundColor(SdkworkAgentsHarmonyTokens.colorPrimarySubtle)
        .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
        .margin({ top: SdkworkAgentsHarmonyTokens.spacingMd })
        .outline({
          width: agentsHarmonyFocusOutlineWidth(this.closeFocused),
          color: SdkworkAgentsHarmonyTokens.colorFocusOutline,
          radius: SdkworkAgentsHarmonyTokens.radiusMd,
        })
        .onFocus(() => {
          this.closeFocused = true;
        })
        .onBlur(() => {
          this.closeFocused = false;
        })
        .onClick(() => {
          this.showDetail = false;
        })
    }
    .width('100%')
    .padding(SdkworkAgentsHarmonyTokens.spacingLg)
    .alignItems(HorizontalAlign.Start)
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
    .borderRadius(SdkworkAgentsHarmonyTokens.radiusLg)
  }

  build() {
    Column() {
      AgentsPageHeader({
        title: assetsMessage('agents.assets.title'),
        profileGlyph: agentsShellMessage('agents.shell.profileActionGlyph'),
        profileAccessibilityText: agentsShellMessage('agents.shell.profileAction'),
        showProfileAction: true,
        onProfileTap: () => {
          this.openProfile();
        },
      })
      Flex({ wrap: FlexWrap.Wrap }) {
        ForEach(this.kinds, (kind: AssetKindFilter) => {
          Button(assetsMessage(kind.labelKey))
            .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
            .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
            .fontWeight(this.kindId === kind.id ? FontWeight.Medium : FontWeight.Normal)
            .fontColor(this.kindId === kind.id
              ? agentsHarmonySelectedLabel()
              : agentsHarmonyUnselectedLabel())
            .backgroundColor(this.kindId === kind.id
              ? agentsHarmonySelectedFill()
              : agentsHarmonyUnselectedFill())
            .borderRadius(SdkworkAgentsHarmonyTokens.radiusPill)
            .padding({
              left: SdkworkAgentsHarmonyTokens.spacingMd,
              right: SdkworkAgentsHarmonyTokens.spacingMd,
            })
            .margin({
              right: SdkworkAgentsHarmonyTokens.spacingSm,
              bottom: SdkworkAgentsHarmonyTokens.spacingSm,
            })
            .accessibilityText(`${assetsMessage('agents.assets.filtersLabel')}: ${assetsMessage(kind.labelKey)}`)
            .onClick(() => {
              this.kindId = kind.id;
              this.reload();
            })
        }, (kind: AssetKindFilter) => kind.id)
      }
      .width('100%')
      .padding({
        left: SdkworkAgentsHarmonyTokens.spacingMd,
        right: SdkworkAgentsHarmonyTokens.spacingMd,
        top: SdkworkAgentsHarmonyTokens.spacingSm,
      })
      if (this.pageState === 'loading') {
        LoadingState({ message: assetsMessage('agents.assets.loading') })
      } else if (this.pageState === 'unavailable' || this.pageState === 'error') {
        EmptyState({
          message: assetsMessage(this.messageKey),
          actionLabel: assetsMessage('agents.assets.retry'),
          actionAccessibilityText: assetsMessage('agents.assets.retry'),
          onAction: () => {
            this.reload();
          },
        })
      } else if (this.pageState === 'empty') {
        EmptyState({ message: assetsMessage('agents.assets.empty') })
      } else {
        List({ space: SdkworkAgentsHarmonyTokens.spacingSm }) {
          ForEach(this.groups, (group: AssetDateGroup) => {
            ListItemGroup({ header: this.groupHeader(group.date) }) {
              ForEach(group.items, (item: AssetItem) => {
                ListItem() {
                  Row() {
                    Text(item.title)
                      .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
                      .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
                      .layoutWeight(1)
                    Text(item.kind)
                      .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
                      .fontColor(SdkworkAgentsHarmonyTokens.colorTextTertiary)
                  }
                  .width('100%')
                  .height(SdkworkAgentsHarmonyTokens.minTouchTarget + SdkworkAgentsHarmonyTokens.spacingSm)
                  .padding({ left: SdkworkAgentsHarmonyTokens.spacingMd, right: SdkworkAgentsHarmonyTokens.spacingMd })
                  .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
                  .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
                  .accessibilityGroup(true)
                  .accessibilityText(`${item.title} ${item.kind}`)
                  .onClick(() => {
                    this.openDetail(item);
                  })
                }
              }, (item: AssetItem) => item.id)
            }
          }, (group: AssetDateGroup) => group.date)
        }
        .width('100%')
        .layoutWeight(1)
        .padding({
          left: SdkworkAgentsHarmonyTokens.spacingMd,
          right: SdkworkAgentsHarmonyTokens.spacingMd,
          top: SdkworkAgentsHarmonyTokens.spacingSm,
        })
        .scrollBar(BarState.Off)
        .bindSheet(this.showDetail, this.detailSheet(), {
          height: SheetSize.MEDIUM,
          onDisappear: () => {
            this.showDetail = false;
          },
        })
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
  }

  @Builder
  groupHeader(date: string) {
    Text(date)
      .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
      .fontColor(SdkworkAgentsHarmonyTokens.colorTextTertiary)
      .width('100%')
      .padding({
        left: SdkworkAgentsHarmonyTokens.spacingMd,
        top: SdkworkAgentsHarmonyTokens.spacingSm,
        bottom: SdkworkAgentsHarmonyTokens.spacingSm,
      })
  }
}
