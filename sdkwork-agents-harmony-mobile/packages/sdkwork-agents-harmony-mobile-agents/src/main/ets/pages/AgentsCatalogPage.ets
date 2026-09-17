import { EmptyState } from '@sdkwork/sdkwork-agents-harmony-mobile-commons';

/**
 * Route-level capability page. Root pages mount this; business UI lives here.
 */
@Component
export struct AgentsCatalogPage {
  @Prop title: string = 'Agents';

  build() {
    Column() {
      Text(this.title)
        .fontSize(20)
        .fontWeight(FontWeight.Bold)
        .margin({ bottom: 16 })
      EmptyState({ message: 'No agents yet' })
    }
    .width('100%')
    .height('100%')
    .padding(16)
  }
}
