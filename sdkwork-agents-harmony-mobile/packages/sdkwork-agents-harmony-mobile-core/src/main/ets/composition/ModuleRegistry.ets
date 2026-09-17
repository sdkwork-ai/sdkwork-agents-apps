import { agentsRouteContributions } from '@sdkwork/sdkwork-agents-harmony-mobile-agents';

/**
 * Module registry.
 *
 * The root bootstrap reads this registry instead of importing capability
 * packages directly.
 */
export interface AgentsHarmonyModuleRegistration {
  readonly id: string;
  readonly routeIdPrefix: string;
}

export function listAgentsHarmonyModules(): AgentsHarmonyModuleRegistration[] {
  return [
    { id: 'agents', routeIdPrefix: 'app.agents.' },
  ];
}

export function listAgentsHarmonyModuleRouteCount(): number {
  return agentsRouteContributions.length;
}
