import { AbilityContext } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

import { type AgentsAppSdkClient, type HostAdapterResult } from '@sdkwork/sdkwork-agents-harmony-mobile-core';
import { configureAgentsSettingsStore } from '@sdkwork/sdkwork-agents-harmony-mobile-profile';
import {
  type AgentsHarmonyNavigator,
  type AgentsHarmonyRouteRegistration,
  AGENTS_HARMONY_FALLBACK_LOCALE,
  configureAgentsHarmonyLocale,
  configureAgentsHarmonyNavigator,
  getAgentsHarmonyNavigator,
} from '@sdkwork/sdkwork-agents-harmony-mobile-shell';
import { attachAgentsHarmonyPreferences } from '@sdkwork/sdkwork-agents-harmony-mobile-host';

import { getAgentsHarmonyHostAdapters } from './HostAdapters';
import { createAgentsHarmonyRoutes } from './Routes';
import { getAgentsHarmonySdkClients } from './SdkClients';

const DOMAIN: number = 0x0000;
const TAG: string = 'SdkworkAgentsShell';

/**
 * Shell composition for the HarmonyOS root.
 *
 * Authority: `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` sections 4 and 7. The root
 * composition module installs the locale, route stack, navigator, host
 * preference adapter, and settings store before any screen is built. It owns no
 * product copy or business logic.
 *
 * This runs even when runtime-config projection or SDK construction is still
 * pending, so the shell (tabs, profile hub, settings) stays usable and reports
 * capability gaps explicitly instead of failing to render.
 */
export interface AgentsHarmonyShellRuntime {
  readonly navigator: AgentsHarmonyNavigator;
  readonly routeCount: number;
}

export function initializeAgentsHarmonyShell(context: AbilityContext): AgentsHarmonyShellRuntime {
  const adapters = getAgentsHarmonyHostAdapters();
  configureAgentsSettingsStore(adapters.preferences);

  const routes: AgentsHarmonyRouteRegistration[] = createAgentsHarmonyRoutes();
  const navigator: AgentsHarmonyNavigator = configureAgentsHarmonyNavigator(routes);

  // Locale defaults to the declared fallback until the host reports the device
  // language; the shell must never render before copy can be resolved.
  configureAgentsHarmonyLocale(AGENTS_HARMONY_FALLBACK_LOCALE);

  adapters.deviceInfo.systemLanguage()
    .then((result: HostAdapterResult<string>) => {
      const value: string | undefined = result.value;
      if (result.ok && value !== undefined) {
        configureAgentsHarmonyLocale(value);
      }
    })
    .catch((error: Error) => {
      hilog.error(DOMAIN, TAG, 'system language resolution failed: %{public}s', error.message);
    });

  attachAgentsHarmonyPreferences(adapters, context)
    .then((attached: boolean) => {
      hilog.info(DOMAIN, TAG, 'preferences adapter attached: %{public}s', String(attached));
    })
    .catch((error: Error) => {
      hilog.error(DOMAIN, TAG, 'preferences adapter attach failed: %{public}s', error.message);
    });

  hilog.info(DOMAIN, TAG, 'shell composed with %{public}d routes', routes.length);
  return { navigator, routeCount: routes.length };
}

/**
 * Resolves the injected app SDK client for capability pages.
 *
 * Returns `null` when bootstrap has not produced a transport yet. Services map
 * `null` to the explicit `unavailable` page state, so a page never fabricates
 * data to cover a missing client.
 */
export function resolveAgentsAppSdkClient(): AgentsAppSdkClient | null {
  try {
    return getAgentsHarmonySdkClients().agents;
  } catch (error) {
    return null;
  }
}

/** Navigator shared by the tab container and router-instantiated pages. */
export function resolveAgentsHarmonyNavigator(): AgentsHarmonyNavigator {
  return getAgentsHarmonyNavigator();
}
