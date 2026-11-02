import {
  AgentsPageHeader,
  LoadingState,
  SdkworkAgentsHarmonyTokens,
  agentsHarmonyFocusOutlineWidth,
  agentsHarmonySelectedFill,
  agentsHarmonySelectedLabel,
  agentsHarmonyUnselectedFill,
  agentsHarmonyUnselectedLabel,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import {
  type HostAdapterResult,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';
import {
  getAgentsHarmonyNavigator,
  type AgentsHarmonyNavigator,
} from '@sdkwork/sdkwork-agents-harmony-mobile-shell';

import { profileMessage } from '../i18n/ProfileMessages';
import { type AgentsSettings } from '../models/ProfileModels';
import {
  AGENTS_SETTINGS_GRID_DENSITIES,
  AgentsSettingsStore,
  getAgentsSettingsStore,
} from '../services/AgentsSettingsStore';

/** Router entry for `app.agents.settings.index`. */
@Builder
export function SettingsPageBuilder() {
  SettingsPage();
}

/**
 * Settings page (`app.agents.settings.index`) with a real persisted form.
 *
 * Authority: `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 7 and
 * `APP_HARMONY_NATIVE_UI_SPEC.md` section 5 (forms handle duplicate submit,
 * validation, and storage errors). Values round-trip through the host
 * `PreferencesAdapter`, so a save is only reported after the platform write
 * succeeded.
 *
 * Theme: `specs/client-theme.spec.json` — switch rows are white `colorSurface`
 * cards on the `colorBackground` page, the density selector is a pill chip set,
 * and the save action is the page's single `colorPrimary` control. The switch
 * track uses `colorPrimary`; the save notice uses `colorSuccess`/`colorDanger`
 * together with the outcome text, so colour is never the only signal.
 */
@Entry
@Component
export struct SettingsPage {
  @State pageState: string = 'loading';
  @State enterToSend: boolean = false;
  @State autoScroll: boolean = true;
  @State gridDensity: string = 'comfortable';
  @State noticeKey: string = '';
  @State saving: boolean = false;
  /** Focused density chip id ('' when no chip holds focus). */
  @State focusedDensity: string = '';
  /** Focus state for the save action. */
  @State saveFocused: boolean = false;
  private store: AgentsSettingsStore = getAgentsSettingsStore();
  private navigator: AgentsHarmonyNavigator = getAgentsHarmonyNavigator();

  aboutToAppear(): void {
    this.reload();
  }

  private async reload(): Promise<void> {
    this.pageState = 'loading';
    const settings: AgentsSettings = await this.store.load();
    this.enterToSend = settings.enterToSend;
    this.autoScroll = settings.autoScroll;
    this.gridDensity = settings.gridDensity;
    this.pageState = 'ready';
  }

  private async save(): Promise<void> {
    if (this.saving) {
      return;
    }
    this.saving = true;
    const settings: AgentsSettings = {
      enterToSend: this.enterToSend,
      autoScroll: this.autoScroll,
      gridDensity: this.gridDensity,
    };
    const result: HostAdapterResult<void> = await this.store.save(settings);
    this.saving = false;
    this.noticeKey = result.ok ? 'agents.settings.saved' : 'agents.settings.saveFailed';
  }

  build() {
    Column() {
      AgentsPageHeader({
        title: profileMessage('agents.settings.title'),
        profileGlyph: '',
        profileAccessibilityText: '',
        showProfileAction: false,
        showBackAction: true,
        backAccessibilityText: profileMessage('agents.settings.back'),
        onBackTap: () => {
          this.navigator.back();
        },
      })
      if (this.pageState === 'loading') {
        LoadingState({ message: profileMessage('agents.settings.loading') })
      } else {
        Scroll() {
          Column() {
            Text(profileMessage('agents.settings.chatSection'))
              .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
              .fontWeight(FontWeight.Medium)
              .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
              .width('100%')
            Row() {
              Column() {
                Text(profileMessage('agents.settings.enterToSend'))
                  .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
                  .width('100%')
                Text(profileMessage('agents.settings.enterToSendHint'))
                  .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
                  .width('100%')
                  .margin({ top: SdkworkAgentsHarmonyTokens.spacingXs })
              }
              .layoutWeight(1)
              .alignItems(HorizontalAlign.Start)
              Toggle({ type: ToggleType.Switch, isOn: this.enterToSend })
                .width(SdkworkAgentsHarmonyTokens.minTouchTarget)
                .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
                .selectedColor(SdkworkAgentsHarmonyTokens.colorPrimary)
                .accessibilityText(profileMessage('agents.settings.enterToSend'))
                .onChange((isOn: boolean) => {
                  this.enterToSend = isOn;
                })
            }
            .width('100%')
            .constraintSize({ minHeight: SdkworkAgentsHarmonyTokens.minTouchTarget })
            .padding(SdkworkAgentsHarmonyTokens.spacingMd)
            .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
            .borderRadius(SdkworkAgentsHarmonyTokens.radiusLg)
            .margin({ top: SdkworkAgentsHarmonyTokens.spacingMd })
            Row() {
              Column() {
                Text(profileMessage('agents.settings.autoScroll'))
                  .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
                  .width('100%')
                Text(profileMessage('agents.settings.autoScrollHint'))
                  .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
                  .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
                  .width('100%')
                  .margin({ top: SdkworkAgentsHarmonyTokens.spacingXs })
              }
              .layoutWeight(1)
              .alignItems(HorizontalAlign.Start)
              Toggle({ type: ToggleType.Switch, isOn: this.autoScroll })
                .width(SdkworkAgentsHarmonyTokens.minTouchTarget)
                .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
                .selectedColor(SdkworkAgentsHarmonyTokens.colorPrimary)
                .accessibilityText(profileMessage('agents.settings.autoScroll'))
                .onChange((isOn: boolean) => {
                  this.autoScroll = isOn;
                })
            }
            .width('100%')
            .constraintSize({ minHeight: SdkworkAgentsHarmonyTokens.minTouchTarget })
            .padding(SdkworkAgentsHarmonyTokens.spacingMd)
            .backgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
            .borderRadius(SdkworkAgentsHarmonyTokens.radiusLg)
            .margin({ top: SdkworkAgentsHarmonyTokens.spacingSm })
            Text(profileMessage('agents.settings.assetsSection'))
              .fontSize(SdkworkAgentsHarmonyTokens.fontSubtitle)
              .fontWeight(FontWeight.Medium)
              .fontColor(SdkworkAgentsHarmonyTokens.colorTextPrimary)
              .width('100%')
              .margin({ top: SdkworkAgentsHarmonyTokens.spacingLg })
            Text(profileMessage('agents.settings.gridDensity'))
              .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
              .fontColor(SdkworkAgentsHarmonyTokens.colorTextSecondary)
              .width('100%')
              .margin({ top: SdkworkAgentsHarmonyTokens.spacingSm, bottom: SdkworkAgentsHarmonyTokens.spacingXs })
            Flex({ wrap: FlexWrap.Wrap }) {
              ForEach(AGENTS_SETTINGS_GRID_DENSITIES, (density: string) => {
                Button(profileMessage(`agents.settings.gridDensity.${density}`))
                  .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
                  .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
                  .fontWeight(this.gridDensity === density ? FontWeight.Medium : FontWeight.Normal)
                  .fontColor(this.gridDensity === density
                    ? agentsHarmonySelectedLabel()
                    : agentsHarmonyUnselectedLabel())
                  .backgroundColor(this.gridDensity === density
                    ? agentsHarmonySelectedFill()
                    : agentsHarmonyUnselectedFill())
                  .borderRadius(SdkworkAgentsHarmonyTokens.radiusPill)
                  .padding({
                    left: SdkworkAgentsHarmonyTokens.spacingMd,
                    right: SdkworkAgentsHarmonyTokens.spacingMd,
                  })
                  .margin({ right: SdkworkAgentsHarmonyTokens.spacingSm })
                  .outline({
                    width: agentsHarmonyFocusOutlineWidth(this.focusedDensity === density),
                    color: SdkworkAgentsHarmonyTokens.colorFocusOutline,
                    radius: SdkworkAgentsHarmonyTokens.radiusPill,
                  })
                  .onFocus(() => {
                    this.focusedDensity = density;
                  })
                  .onBlur(() => {
                    this.focusedDensity = '';
                  })
                  .accessibilityText(profileMessage(`agents.settings.gridDensity.${density}`))
                  .onClick(() => {
                    this.gridDensity = density;
                  })
              }, (density: string) => density)
            }
            .width('100%')
            Button(profileMessage('agents.settings.save'))
              .width('100%')
              .height(SdkworkAgentsHarmonyTokens.minTouchTarget)
              .fontSize(SdkworkAgentsHarmonyTokens.fontBody)
              .fontWeight(FontWeight.Medium)
              .fontColor(SdkworkAgentsHarmonyTokens.colorOnPrimary)
              .backgroundColor(SdkworkAgentsHarmonyTokens.colorPrimary)
              .borderRadius(SdkworkAgentsHarmonyTokens.radiusMd)
              .margin({ top: SdkworkAgentsHarmonyTokens.spacingLg })
              .outline({
                width: agentsHarmonyFocusOutlineWidth(this.saveFocused),
                color: SdkworkAgentsHarmonyTokens.colorFocusOutline,
                radius: SdkworkAgentsHarmonyTokens.radiusMd,
              })
              .onFocus(() => {
                this.saveFocused = true;
              })
              .onBlur(() => {
                this.saveFocused = false;
              })
              .enabled(!this.saving)
              .onClick(() => {
                this.save();
              })
            if (this.noticeKey.length > 0) {
              Text(profileMessage(this.noticeKey))
                .fontSize(SdkworkAgentsHarmonyTokens.fontCaption)
                .fontColor(this.noticeKey === 'agents.settings.saved'
                  ? SdkworkAgentsHarmonyTokens.colorSuccess
                  : SdkworkAgentsHarmonyTokens.colorDanger)
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
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
  }
}
