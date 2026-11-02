import { router } from '@kit.ArkUI';

import {
  canOpenAgentsHarmonyRoute,
  createAgentsHarmonyRouteStack,
  findAgentsHarmonyRoute,
  type AgentsHarmonyRouteRegistration,
} from './RouteStack';

/**
 * Shell navigation seam.
 *
 * Authority: `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 7 ("deep links
 * should resolve to route ids first, then platform-specific navigation adapters
 * map the route id to a physical path or route object") and
 * `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 8.
 *
 * Capability pages never call the HarmonyOS router directly: they receive this
 * port and ask for a route id. The shell owns id -> physical page resolution,
 * auth gating, and the "not mounted yet" outcome.
 */

export interface AgentsHarmonyNavigationResult {
  readonly opened: boolean;
  /** Stable machine reason; localized copy is resolved by the caller. */
  readonly reason?: 'unknown-route' | 'not-delivered' | 'tab-route' | 'router-rejected';
}

export interface AgentsHarmonyNavigator {
  /** Opens a stack (page/sheet) route by canonical id. */
  open(routeId: string): Promise<AgentsHarmonyNavigationResult>;
  /** True when `open(routeId)` would resolve to a mounted screen. */
  canOpen(routeId: string): boolean;
  /** Pops the current stack entry. */
  back(): void;
}

/**
 * Router-backed navigator.
 *
 * Named routes are registered per capability package through the package's
 * `route_map.json` profile, keyed by the canonical route id, so the physical
 * page path is resolved by the platform router and not by ad-hoc string
 * concatenation here.
 */
export class RouterAgentsHarmonyNavigator implements AgentsHarmonyNavigator {
  private routes: AgentsHarmonyRouteRegistration[] = [];

  configure(routes: AgentsHarmonyRouteRegistration[]): void {
    this.routes = createAgentsHarmonyRouteStack(routes);
  }

  canOpen(routeId: string): boolean {
    const route = findAgentsHarmonyRoute(this.routes, routeId);
    if (route === null) {
      return false;
    }
    if (route.presentation === 'tab') {
      return false;
    }
    return canOpenAgentsHarmonyRoute(this.routes, routeId);
  }

  async open(routeId: string): Promise<AgentsHarmonyNavigationResult> {
    const route = findAgentsHarmonyRoute(this.routes, routeId);
    if (route === null) {
      return { opened: false, reason: 'unknown-route' };
    }
    if (route.presentation === 'tab') {
      return { opened: false, reason: 'tab-route' };
    }
    if (route.pageStatus !== 'delivered') {
      return { opened: false, reason: 'not-delivered' };
    }
    try {
      await router.pushNamedRoute({ name: routeId });
      return { opened: true };
    } catch (error) {
      return { opened: false, reason: 'router-rejected' };
    }
  }

  back(): void {
    router.back();
  }
}

let navigator: AgentsHarmonyNavigator = new RouterAgentsHarmonyNavigator();

/** Replaces the navigator and installs the assembled route stack. */
export function configureAgentsHarmonyNavigator(
  routes: AgentsHarmonyRouteRegistration[],
): AgentsHarmonyNavigator {
  const routerNavigator = new RouterAgentsHarmonyNavigator();
  routerNavigator.configure(routes);
  navigator = routerNavigator;
  return navigator;
}

/**
 * Process-wide navigator.
 *
 * Router-instantiated pages (membership, profile, settings) have no parent
 * component able to pass props, so they resolve the shell navigator here. Tab
 * pages still receive the navigator explicitly.
 */
export function getAgentsHarmonyNavigator(): AgentsHarmonyNavigator {
  return navigator;
}
