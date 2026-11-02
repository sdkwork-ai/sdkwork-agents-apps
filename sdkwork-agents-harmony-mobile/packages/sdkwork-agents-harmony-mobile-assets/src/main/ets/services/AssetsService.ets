import {
  unavailableAgentsPageSnapshot,
  type AgentsPageSnapshot,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';

import { type AssetDateGroup, type AssetItem, type AssetKindFilter } from '../models/AssetModels';

/**
 * Asset library use cases.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 4 and
 * `docs/engineering/plans/PLAN-2026-1102-client-page-parity.md` section 6.
 *
 * Assets are served by the agents assets app SDK (PC composes
 * `@sdkwork/agents-pc-core/sdk/assetsAppSdkClient`). The Harmony root composes
 * only the agents app SDK and has no adapted ArkTS assets transport yet, so the
 * service reports `unavailable` instead of an empty gallery. Date grouping is
 * real, transport-independent logic and is exercised as soon as rows arrive.
 */
export class AssetsService {
  kinds(): AssetKindFilter[] {
    return [
      { id: 'all', labelKey: 'agents.assets.kind.all' },
      { id: 'image', labelKey: 'agents.assets.kind.image' },
      { id: 'video', labelKey: 'agents.assets.kind.video' },
      { id: 'audio', labelKey: 'agents.assets.kind.audio' },
      { id: 'document', labelKey: 'agents.assets.kind.document' },
    ];
  }

  async loadGroups(kindId: string): Promise<AgentsPageSnapshot<AssetDateGroup>> {
    const filtered: AssetKindFilter[] = this.kinds().filter(
      (kind: AssetKindFilter) => kind.id === kindId,
    );
    if (filtered.length === 0) {
      return unavailableAgentsPageSnapshot<AssetDateGroup>('agents.assets.unavailable');
    }
    return unavailableAgentsPageSnapshot<AssetDateGroup>('agents.assets.unavailable');
  }

  /**
   * Groups assets by ISO calendar date (`YYYY-MM-DD`), preserving input order
   * inside each bucket. Invalid timestamps fall into the raw `createdAt` bucket
   * instead of being dropped.
   */
  groupByDate(items: AssetItem[]): AssetDateGroup[] {
    const order: string[] = [];
    const buckets: Map<string, AssetItem[]> = new Map<string, AssetItem[]>();
    for (const item of items) {
      const key: string = AssetsService.dateKey(item.createdAt);
      const existing: AssetItem[] | undefined = buckets.get(key);
      if (existing === undefined) {
        buckets.set(key, [item]);
        order.push(key);
      } else {
        existing.push(item);
      }
    }
    return order.map((date: string) => {
      const bucket: AssetItem[] | undefined = buckets.get(date);
      return { date, items: bucket === undefined ? [] : bucket };
    });
  }

  static dateKey(createdAt: string): string {
    const separator: number = createdAt.indexOf('T');
    if (separator > 0) {
      return createdAt.slice(0, separator);
    }
    return createdAt.length > 0 ? createdAt : 'unknown';
  }
}
