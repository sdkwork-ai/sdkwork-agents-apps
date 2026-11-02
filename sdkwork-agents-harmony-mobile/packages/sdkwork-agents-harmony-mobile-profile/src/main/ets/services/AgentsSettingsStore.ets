import {
  type HostAdapterResult,
  type PreferencesAdapter,
} from '@sdkwork/sdkwork-agents-harmony-mobile-core';

import { type AgentsSettings } from '../models/ProfileModels';

/**
 * Persisted settings store.
 *
 * Authority: `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 7 — non-sensitive
 * preferences go through the host `PreferencesAdapter`; the settings UI never
 * touches HarmonyOS `preferences` directly. Values are stored as strings so the
 * adapter contract stays one narrow primitive.
 */

const KEY_ENTER_TO_SEND: string = 'agents.settings.chat.enterToSend';
const KEY_AUTO_SCROLL: string = 'agents.settings.chat.autoScroll';
const KEY_GRID_DENSITY: string = 'agents.settings.assets.gridDensity';

export const AGENTS_SETTINGS_DEFAULT: AgentsSettings = {
  enterToSend: false,
  autoScroll: true,
  gridDensity: 'comfortable',
};

export const AGENTS_SETTINGS_GRID_DENSITIES: string[] = ['comfortable', 'compact'];

export class AgentsSettingsStore {
  private readonly adapter: PreferencesAdapter;

  constructor(adapter: PreferencesAdapter) {
    this.adapter = adapter;
  }

  /** Reads the persisted settings; missing or unreadable keys fall back to defaults. */
  async load(): Promise<AgentsSettings> {
    const enterToSend: HostAdapterResult<string> = await this.adapter.read(KEY_ENTER_TO_SEND);
    const autoScroll: HostAdapterResult<string> = await this.adapter.read(KEY_AUTO_SCROLL);
    const gridDensity: HostAdapterResult<string> = await this.adapter.read(KEY_GRID_DENSITY);
    const enterToSendValue: string = AgentsSettingsStore.valueOrEmpty(enterToSend);
    const autoScrollValue: string = AgentsSettingsStore.valueOrEmpty(autoScroll);
    const densityValue: string = AgentsSettingsStore.valueOrEmpty(gridDensity);
    return {
      enterToSend: enterToSendValue.length === 0
        ? AGENTS_SETTINGS_DEFAULT.enterToSend
        : enterToSendValue === 'true',
      autoScroll: autoScrollValue.length === 0
        ? AGENTS_SETTINGS_DEFAULT.autoScroll
        : autoScrollValue === 'true',
      gridDensity: AGENTS_SETTINGS_GRID_DENSITIES.includes(densityValue)
        ? densityValue
        : AGENTS_SETTINGS_DEFAULT.gridDensity,
    };
  }

  private static valueOrEmpty(result: HostAdapterResult<string>): string {
    if (!result.ok) {
      return '';
    }
    const value: string | undefined = result.value;
    return value === undefined ? '' : value;
  }

  /** Persists every field; returns the first adapter failure unchanged. */
  async save(settings: AgentsSettings): Promise<HostAdapterResult<void>> {
    const enterToSend: HostAdapterResult<void> = await this.adapter.write(
      KEY_ENTER_TO_SEND,
      settings.enterToSend ? 'true' : 'false',
    );
    if (!enterToSend.ok) {
      return enterToSend;
    }
    const autoScroll: HostAdapterResult<void> = await this.adapter.write(
      KEY_AUTO_SCROLL,
      settings.autoScroll ? 'true' : 'false',
    );
    if (!autoScroll.ok) {
      return autoScroll;
    }
    const density: string = AGENTS_SETTINGS_GRID_DENSITIES.includes(settings.gridDensity)
      ? settings.gridDensity
      : AGENTS_SETTINGS_DEFAULT.gridDensity;
    return this.adapter.write(KEY_GRID_DENSITY, density);
  }
}

let settingsStore: AgentsSettingsStore | null = null;

/** Installs the store with the host adapter supplied by root composition. */
export function configureAgentsSettingsStore(adapter: PreferencesAdapter): AgentsSettingsStore {
  settingsStore = new AgentsSettingsStore(adapter);
  return settingsStore;
}

/**
 * Process-wide settings store.
 *
 * Router-instantiated settings pages have no parent able to pass the adapter, so
 * the composition root installs it here; the fallback adapter reports
 * `unavailable` instead of pretending a preference was saved.
 */
export function getAgentsSettingsStore(): AgentsSettingsStore {
  if (settingsStore === null) {
    configureAgentsSettingsStore(new UnavailablePreferencesAdapter());
  }
  return settingsStore as AgentsSettingsStore;
}

/** Adapter used before root composition runs (for example isolated preview). */
export class UnavailablePreferencesAdapter implements PreferencesAdapter {
  read(key: string): Promise<HostAdapterResult<string>> {
    return Promise.resolve({ ok: false, error: 'unavailable' });
  }

  write(key: string, value: string): Promise<HostAdapterResult<void>> {
    return Promise.resolve({ ok: false, error: 'unavailable' });
  }

  remove(key: string): Promise<HostAdapterResult<void>> {
    return Promise.resolve({ ok: false, error: 'unavailable' });
  }
}
