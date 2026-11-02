/**
 * Module registry.
 *
 * Authority: `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 5 — dependency
 * direction is core/commons -> shell -> capability packages, so core must not
 * import a capability package to count its routes. The root bootstrap
 * (`entry/src/main/ets/bootstrap/Routes.ets`) assembles the route registry from
 * the capability contributions and hands the count back here for diagnostics.
 */

export interface AgentsHarmonyModuleRegistration {
  readonly id: string;
  readonly routeIdPrefix: string;
}

export function listAgentsHarmonyModules(): AgentsHarmonyModuleRegistration[] {
  return [
    { id: 'agents', routeIdPrefix: 'app.agents.catalog.' },
    { id: 'conversation', routeIdPrefix: 'app.agents.conversation.' },
    { id: 'inspiration', routeIdPrefix: 'app.agents.inspiration.' },
    { id: 'creative', routeIdPrefix: 'app.agents.creative.' },
    { id: 'assets', routeIdPrefix: 'app.agents.assets.' },
    { id: 'membership', routeIdPrefix: 'app.agents.membership.' },
    { id: 'profile', routeIdPrefix: 'app.agents.profile.' },
    { id: 'settings', routeIdPrefix: 'app.agents.settings.' },
    { id: 'projects', routeIdPrefix: 'app.agents.projects.' },
    { id: 'library', routeIdPrefix: 'app.agents.library.' },
    { id: 'automation', routeIdPrefix: 'app.agents.automation.' },
    { id: 'canvas', routeIdPrefix: 'app.agents.canvas.' },
  ];
}

let registeredRouteCount: number = 0;

/** Records the assembled route count. Called from root bootstrap only. */
export function setAgentsHarmonyModuleRouteCount(routeCount: number): void {
  registeredRouteCount = routeCount < 0 ? 0 : routeCount;
}

export function listAgentsHarmonyModuleRouteCount(): number {
  return registeredRouteCount;
}
