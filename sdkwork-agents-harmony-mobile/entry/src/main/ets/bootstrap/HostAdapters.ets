import { AgentsHarmonyHostAdapters, createHostAdapters } from '@sdkwork/sdkwork-agents-harmony-mobile-host';

/**
 * Host adapter registration.
 *
 * Authority: `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 7. Feature
 * packages depend on these typed interfaces and never call HarmonyOS system
 * APIs directly.
 */

let hostAdapters: AgentsHarmonyHostAdapters | null = null;

export function registerAgentsHarmonyHostAdapters(): AgentsHarmonyHostAdapters {
  hostAdapters = createHostAdapters();
  return hostAdapters;
}

export function getAgentsHarmonyHostAdapters(): AgentsHarmonyHostAdapters {
  if (hostAdapters === null) {
    return registerAgentsHarmonyHostAdapters();
  }
  return hostAdapters;
}
