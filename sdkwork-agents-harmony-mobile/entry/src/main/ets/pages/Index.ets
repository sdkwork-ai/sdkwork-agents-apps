import { type AgentsAppSdkClient } from '@sdkwork/sdkwork-agents-harmony-mobile-core';
import {
  AGENTS_HARMONY_MOBILE_TABS,
  AgentsHarmonyTabBarItem,
  agentsShellMessage,
  persistAgentsHarmonyActiveTabIndex,
  restoreAgentsHarmonyActiveTabIndex,
  type AgentsHarmonyNavigator,
  type AgentsHarmonyTabDescriptor,
} from '@sdkwork/sdkwork-agents-harmony-mobile-shell';
import { SdkworkAgentsHarmonyTokens } from '@sdkwork/sdkwork-agents-harmony-mobile-commons';
import { AgentsListPage, ConversationPage } from '@sdkwork/sdkwork-agents-harmony-mobile-agents';
import { AssetsPage } from '@sdkwork/sdkwork-agents-harmony-mobile-assets';
import { CreativePage } from '@sdkwork/sdkwork-agents-harmony-mobile-creative';
import { InspirationPage } from '@sdkwork/sdkwork-agents-harmony-mobile-inspiration';
import { resolveAgentsAppSdkClient, resolveAgentsHarmonyNavigator } from '../bootstrap/ShellComposition';

/**
 * Root page and bottom-tab shell host.
 *
 * Authority: `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 3 (mobile shell
 * owns tabs), `specs/client-page-parity.spec.json`
 * `navigation.mobileBottomTabs`, and `specs/client-theme.spec.json` (light
 * `tech-blue-flat` shell: `#F4F7FC` page background, white tab bar with a blue
 * active item, no divider or shadow above the bar).
 *
 * This page is the only router page in the entry module: the five PC-primary
 * surfaces are hosted as tabs, and stack surfaces (membership, profile, settings)
 * are opened by route id through
 * `packages/sdkwork-agents-harmony-mobile-shell`.
 *
 * Tab state survives background/foreground through two layers: each
 * `TabContent` subtree stays mounted, and the selected index is persisted to
 * application storage (`restoreAgentsHarmonyActiveTabIndex`).
 */
@Entry
@Component
struct Index {
  @State activeTabIndex: number = 0;
  private navigator: AgentsHarmonyNavigator = resolveAgentsHarmonyNavigator();
  private client: AgentsAppSdkClient | null = null;

  aboutToAppear(): void {
    this.client = resolveAgentsAppSdkClient();
    this.activeTabIndex = restoreAgentsHarmonyActiveTabIndex();
  }

  private tabAccessibilityText(descriptor: AgentsHarmonyTabDescriptor, index: number): string {
    const stateKey: string = this.activeTabIndex === index
      ? 'agents.shell.tab.selected'
      : 'agents.shell.tab.unselected';
    return `${agentsShellMessage(descriptor.labelKey)} ${agentsShellMessage(stateKey)}`;
  }

  @Builder
  tabBar(index: number) {
    AgentsHarmonyTabBarItem({
      label: agentsShellMessage(AGENTS_HARMONY_MOBILE_TABS[index].labelKey),
      selected: this.activeTabIndex === index,
      accessibilityText: this.tabAccessibilityText(AGENTS_HARMONY_MOBILE_TABS[index], index),
    })
  }

  build() {
    Column() {
      Tabs({ barPosition: BarPosition.End, index: this.activeTabIndex }) {
        TabContent() {
          ConversationPage({ navigator: this.navigator, client: this.client })
        }
        .tabBar(this.tabBar(0))

        TabContent() {
          InspirationPage({ navigator: this.navigator })
        }
        .tabBar(this.tabBar(1))

        TabContent() {
          CreativePage({ navigator: this.navigator })
        }
        .tabBar(this.tabBar(2))

        TabContent() {
          AssetsPage({ navigator: this.navigator })
        }
        .tabBar(this.tabBar(3))

        TabContent() {
          AgentsListPage({ navigator: this.navigator, client: this.client })
        }
        .tabBar(this.tabBar(4))
      }
      .barMode(BarMode.Fixed)
      .barHeight(SdkworkAgentsHarmonyTokens.tabBarHeight)
      .barBackgroundColor(SdkworkAgentsHarmonyTokens.colorSurface)
      // Theme: the bar is separated from the page by tonal fill only, so the
      // tab/content divider is drawn at zero width instead of removed visually.
      .divider({ strokeWidth: 0 })
      .width('100%')
      .height('100%')
      .onChange((index: number) => {
        this.activeTabIndex = index;
        persistAgentsHarmonyActiveTabIndex(index);
      })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(SdkworkAgentsHarmonyTokens.colorBackground)
    .expandSafeArea([SafeAreaType.SYSTEM], [SafeAreaEdge.TOP, SafeAreaEdge.BOTTOM])
  }
}
