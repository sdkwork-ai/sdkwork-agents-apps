import { common } from '@kit.AbilityKit';
import { preferences } from '@kit.ArkData';
import { i18n } from '@kit.LocalizationKit';

import {
  type AppLifecycleAdapter,
  type DeviceInfoAdapter,
  type HostAdapterResult,
  type NetworkStatusAdapter,
  type PreferencesAdapter,
  type SecureStorageAdapter,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';

/**
 * HarmonyOS host adapter implementations.
 *
 * Authority: `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 7. Adapters
 * expose typed methods and stable user-safe errors. They must not own login,
 * token refresh, permission evaluation, business authorization, or raw
 * business API transport.
 *
 * The platform-backed implementations require the HarmonyOS SDK toolchain and
 * concrete ability context injection; the capability set and method signatures
 * are fixed here so feature code compiles unchanged against any host.
 */

export class HarmonySecureStorageAdapter implements SecureStorageAdapter {
  get(key: string): Promise<HostAdapterResult<string>> {
    return Promise.resolve({ ok: false, error: 'unsupported' });
  }

  set(key: string, value: string): Promise<HostAdapterResult<void>> {
    return Promise.resolve({ ok: false, error: 'unsupported' });
  }

  remove(key: string): Promise<HostAdapterResult<void>> {
    return Promise.resolve({ ok: false, error: 'unsupported' });
  }

  clear(): Promise<HostAdapterResult<void>> {
    return Promise.resolve({ ok: false, error: 'unsupported' });
  }
}

export class HarmonyNetworkStatusAdapter implements NetworkStatusAdapter {
  isOnline(): Promise<HostAdapterResult<boolean>> {
    return Promise.resolve({ ok: true, value: true });
  }
}

export class HarmonyAppLifecycleAdapter implements AppLifecycleAdapter {
  currentState(): Promise<HostAdapterResult<string>> {
    return Promise.resolve({ ok: true, value: 'foreground' });
  }
}

const PREFERENCES_STORE_NAME: string = 'sdkwork_agents_preferences';

/**
 * Non-sensitive preference storage on HarmonyOS `preferences`.
 *
 * Used by the settings surface for locally persisted display/input preferences.
 * Tokens, refresh tokens, and credentials must use the secure storage adapter.
 */
export class HarmonyPreferencesAdapter implements PreferencesAdapter {
  private store: preferences.Preferences | null = null;

  /** Binds the adapter to an ability context. Called by root bootstrap only. */
  async attach(context: common.Context): Promise<void> {
    const options: preferences.Options = { name: PREFERENCES_STORE_NAME };
    this.store = await preferences.getPreferences(context, options);
  }

  async read(key: string): Promise<HostAdapterResult<string>> {
    const store: preferences.Preferences | null = this.store;
    if (store === null) {
      return { ok: false, error: 'unavailable' };
    }
    try {
      const value: preferences.ValueType = await store.get(key, '');
      return { ok: true, value: typeof value === 'string' ? value : '' };
    } catch (error) {
      return { ok: false, error: 'invalid-state' };
    }
  }

  async write(key: string, value: string): Promise<HostAdapterResult<void>> {
    const store: preferences.Preferences | null = this.store;
    if (store === null) {
      return { ok: false, error: 'unavailable' };
    }
    try {
      await store.put(key, value);
      await store.flush();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'invalid-state' };
    }
  }

  async remove(key: string): Promise<HostAdapterResult<void>> {
    const store: preferences.Preferences | null = this.store;
    if (store === null) {
      return { ok: false, error: 'unavailable' };
    }
    try {
      await store.delete(key);
      await store.flush();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'invalid-state' };
    }
  }
}

export class HarmonyDeviceInfoAdapter implements DeviceInfoAdapter {
  async systemLanguage(): Promise<HostAdapterResult<string>> {
    try {
      return { ok: true, value: i18n.System.getSystemLanguage() };
    } catch (error) {
      return { ok: false, error: 'unavailable' };
    }
  }
}

export interface AgentsHarmonyHostAdapters {
  readonly capabilities: string[];
  readonly secureStorage: SecureStorageAdapter;
  readonly networkStatus: NetworkStatusAdapter;
  readonly appLifecycle: AppLifecycleAdapter;
  readonly preferences: PreferencesAdapter;
  readonly deviceInfo: DeviceInfoAdapter;
}

export function createHostAdapters(): AgentsHarmonyHostAdapters {
  return {
    capabilities: ['networkStatus', 'appLifecycle', 'preferences', 'deviceInfo'],
    secureStorage: new HarmonySecureStorageAdapter(),
    networkStatus: new HarmonyNetworkStatusAdapter(),
    appLifecycle: new HarmonyAppLifecycleAdapter(),
    preferences: new HarmonyPreferencesAdapter(),
    deviceInfo: new HarmonyDeviceInfoAdapter(),
  };
}

/** Binds the preference adapter to the ability context supplied by bootstrap. */
export async function attachAgentsHarmonyPreferences(
  adapters: AgentsHarmonyHostAdapters,
  context: common.Context,
): Promise<boolean> {
  const adapter: PreferencesAdapter = adapters.preferences;
  if (!(adapter instanceof HarmonyPreferencesAdapter)) {
    return false;
  }
  await adapter.attach(context);
  return true;
}
