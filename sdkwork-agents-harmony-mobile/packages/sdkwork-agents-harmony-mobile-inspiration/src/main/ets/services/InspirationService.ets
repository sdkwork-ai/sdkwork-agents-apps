import {
  unavailableAgentsPageSnapshot,
  type AgentsPageSnapshot,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';

import { type InspirationCard } from '../models/InspirationModels';

/**
 * Discover-feed use cases.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 4 and
 * `docs/engineering/plans/PLAN-2026-1102-client-page-parity.md` section 6.
 *
 * The discover feed is served by the feeds open SDK (PC composes
 * `@sdkwork/agents-pc-core/sdk/feedsOpenSdkClient`); the Harmony root composes
 * only the agents app SDK, and no adapted ArkTS feeds transport exists yet. The
 * service therefore reports `unavailable` instead of pretending the feed is
 * empty. Milestone M3 replaces this return value with the adapted client call.
 */
export class InspirationService {
  async loadFeed(): Promise<AgentsPageSnapshot<InspirationCard>> {
    return unavailableAgentsPageSnapshot<InspirationCard>('agents.inspiration.unavailable');
  }
}
