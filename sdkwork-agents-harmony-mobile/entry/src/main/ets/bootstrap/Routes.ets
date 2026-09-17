import { agentsRouteContributions, type AgentsRouteContribution } from '@sdkwork/sdkwork-agents-harmony-mobile-agents';

/**
 * Route/page registry assembly.
 *
 * Route ids follow `<surface>.<domain>.<capability>.<screen>` and stay aligned
 * with the PC and H5 roots (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md`
 * section 7). Physical Harmony page paths may differ from other platforms.
 */

export function createAgentsHarmonyRoutes(): AgentsRouteContribution[] {
  return agentsRouteContributions;
}
