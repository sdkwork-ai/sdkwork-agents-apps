import {
  agentsRouteContributions,
  type AgentsRouteContribution,
} from '@sdkwork/sdkwork-agents-harmony-mobile-agents';
import { type AgentsHarmonyRouteRegistration } from '@sdkwork/sdkwork-agents-harmony-mobile-shell';
import { setAgentsHarmonyModuleRouteCount } from '@sdkwork/sdkwork-agents-harmony-mobile-core';

/**
 * Route/page registry assembly.
 *
 * Route ids follow `<surface>.<domain>.<capability>.<screen>` and stay aligned
 * with the PC and H5 roots (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md`
 * section 7). Physical Harmony page paths may differ from other platforms.
 *
 * The registry is contract-declared in the agents capability package
 * (`specs/client-page-parity.spec.json` `clients.harmony.registry`); the root
 * composition only assembles and validates it, so core never depends on a
 * capability package.
 */
export function createAgentsHarmonyRoutes(): AgentsHarmonyRouteRegistration[] {
  const routes: AgentsRouteContribution[] = agentsRouteContributions;
  setAgentsHarmonyModuleRouteCount(routes.length);
  return routes.slice();
}
