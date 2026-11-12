import { useState, useEffect } from 'react';

import {
  readAccountScopedItem,
  resolveAppSdkUserId,
  SDKWORK_AGENTS_PC_SESSION_CHANGED_EVENT,
  writeAccountScopedItem,
} from '@sdkwork/agents-pc-core/session';

export interface ModelSettings {
  apiKey: string;
  baseUrl: string;
  temperature: number;
}

/** Only the non-credential fields are persisted (account-scoped). */
interface PersistedModelSettings {
  baseUrl: string;
  temperature: number;
}

const DEFAULT_SETTINGS: ModelSettings = {
  apiKey: '',
  baseUrl: '',
  temperature: 0.7,
};

/**
 * BYO provider API keys are credentials: they never touch browser storage.
 * They live in this module for the page's lifetime and are dropped as soon as
 * the session owner changes, so a second account on the same browser/Electron
 * profile cannot read the previous account's key back.
 */
const sessionApiKeys = new Map<string, string>();
let apiKeyOwner: string | undefined;

function settingsStorageBaseKey(vendor: string): string {
  return `sdkwork-agents-${vendor.toLowerCase()}-settings`;
}

function currentSessionOwner(): string | undefined {
  return resolveAppSdkUserId() ?? undefined;
}

function dropKeysWhenOwnerChanged(): void {
  const owner = currentSessionOwner();
  if (owner !== apiKeyOwner) {
    sessionApiKeys.clear();
    apiKeyOwner = owner;
  }
}

function readSessionApiKey(vendor: string): string {
  dropKeysWhenOwnerChanged();
  return sessionApiKeys.get(vendor) ?? '';
}

function writeSessionApiKey(vendor: string, apiKey: string): void {
  dropKeysWhenOwnerChanged();
  if (apiKey) {
    sessionApiKeys.set(vendor, apiKey);
  } else {
    sessionApiKeys.delete(vendor);
  }
}

/**
 * Drop the pre-scope settings entry. It stored the previous account's key in
 * plain localStorage and cannot be attributed to an account, so it is removed
 * instead of being shown to whoever signs in next.
 */
const scrubbedLegacyVendors = new Set<string>();
function discardLegacyUnscopedSettings(vendor: string): void {
  const normalizedVendor = vendor.toLowerCase();
  if (scrubbedLegacyVendors.has(normalizedVendor)) {
    return;
  }
  scrubbedLegacyVendors.add(normalizedVendor);
  try {
    (globalThis as { localStorage?: Storage }).localStorage
      ?.removeItem(settingsStorageBaseKey(normalizedVendor));
  } catch {
    // Storage unavailable: there is nothing to scrub.
  }
}

function readPersistedSettings(vendor: string): PersistedModelSettings {
  discardLegacyUnscopedSettings(vendor);
  const raw = readAccountScopedItem(settingsStorageBaseKey(vendor));
  if (!raw) {
    return { baseUrl: '', temperature: DEFAULT_SETTINGS.temperature };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedModelSettings>;
    return {
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
      temperature: typeof parsed.temperature === 'number'
        ? parsed.temperature
        : DEFAULT_SETTINGS.temperature,
    };
  } catch {
    return { baseUrl: '', temperature: DEFAULT_SETTINGS.temperature };
  }
}

export function readModelSettings(vendor: string): ModelSettings {
  return {
    ...readPersistedSettings(vendor),
    apiKey: readSessionApiKey(vendor),
  };
}

export function persistModelSettings(vendor: string, settings: ModelSettings): void {
  writeSessionApiKey(vendor, settings.apiKey);
  writeAccountScopedItem(
    settingsStorageBaseKey(vendor),
    JSON.stringify({
      baseUrl: settings.baseUrl,
      temperature: settings.temperature,
    } satisfies PersistedModelSettings),
  );
}

/** Lifecycle/test hook: forget every in-memory provider credential. */
export function clearModelSettingsApiKeys(): void {
  sessionApiKeys.clear();
  apiKeyOwner = undefined;
}

// Signing out drops the credentials even if the settings panel stays mounted.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener(SDKWORK_AGENTS_PC_SESSION_CHANGED_EVENT, (event) => {
    const detail = (event as CustomEvent<{ session?: unknown }>).detail;
    if (!detail?.session) {
      clearModelSettingsApiKeys();
    }
  });
}

export const useModelSettings = (vendor: string) => {
  const [settings, setSettings] = useState<ModelSettings>(() => readModelSettings(vendor));

  useEffect(() => {
    persistModelSettings(vendor, settings);
  }, [settings, vendor]);

  return { settings, setSettings };
};

export const getModelSettings = (vendor: string): ModelSettings => readModelSettings(vendor);
