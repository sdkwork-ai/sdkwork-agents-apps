/**
 * Package-local i18n resource helpers.
 *
 * Authority: `I18N_SPEC.md` sections 6.1 and 7. Authored copy lives in
 * package-local fragments under `src/main/ets/i18n/<locale>/<domain>/<capability>/`;
 * this file only provides locale normalization, catalog selection, and lookup so
 * feature UI never parses platform locale or SDK headers on its own.
 */

export type AgentsHarmonyLocale = 'en-US' | 'zh-CN';

export const AGENTS_HARMONY_SUPPORTED_LOCALES: AgentsHarmonyLocale[] = ['zh-CN', 'en-US'];

/** Default locale when the host adapter cannot resolve one (`I18N_SPEC.md` section 12). */
export const AGENTS_HARMONY_FALLBACK_LOCALE: AgentsHarmonyLocale = 'zh-CN';

/** Flattened message catalog for one locale. */
export type AgentsHarmonyMessageCatalog = Record<string, string>;

export function normalizeAgentsHarmonyLocale(value: string): AgentsHarmonyLocale {
  return value.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}

/**
 * Picks the catalog for a locale.
 *
 * An unsupported locale falls back to the declared fallback locale instead of
 * rendering message keys, so a misconfigured device language degrades to
 * readable copy.
 */
export function selectAgentsHarmonyCatalog(
  zhCn: AgentsHarmonyMessageCatalog,
  enUs: AgentsHarmonyMessageCatalog,
  locale: AgentsHarmonyLocale,
): AgentsHarmonyMessageCatalog {
  return locale === 'en-US' ? enUs : zhCn;
}

/**
 * Looks up one message.
 *
 * A missing key returns the key itself: `I18N_SPEC.md` section 16.2 requires a
 * fail-closed signal rather than silently rendering empty copy, and the visible
 * key is what makes the gap obvious in review and on device.
 */
export function translateAgentsHarmonyMessage(
  catalog: AgentsHarmonyMessageCatalog,
  key: string,
): string {
  const message: string | undefined = catalog[key];
  if (message === undefined || message.length === 0) {
    return key;
  }
  return message;
}

/** Looks up one message with an explicit fallback for optional copy. */
export function translateAgentsHarmonyMessageOrDefault(
  catalog: AgentsHarmonyMessageCatalog,
  key: string,
  fallback: string,
): string {
  const message: string | undefined = catalog[key];
  if (message === undefined || message.length === 0) {
    return fallback;
  }
  return message;
}

/** Typed message facade handed to UI components. */
export class AgentsHarmonyMessages {
  private readonly catalog: AgentsHarmonyMessageCatalog;

  constructor(catalog: AgentsHarmonyMessageCatalog) {
    this.catalog = catalog;
  }

  t(key: string): string {
    return translateAgentsHarmonyMessage(this.catalog, key);
  }

  tOr(key: string, fallback: string): string {
    return translateAgentsHarmonyMessageOrDefault(this.catalog, key, fallback);
  }

  has(key: string): boolean {
    const message: string | undefined = this.catalog[key];
    return message !== undefined && message.length > 0;
  }
}

/**
 * Merges authored fragments into one package catalog.
 *
 * Later fragments win, which is the declared override precedence described in
 * `I18N_SPEC.md` section 7.
 */
export function mergeAgentsHarmonyCatalogs(
  fragments: AgentsHarmonyMessageCatalog[],
): AgentsHarmonyMessageCatalog {
  const merged: AgentsHarmonyMessageCatalog = {};
  for (const fragment of fragments) {
    for (const key of Object.keys(fragment)) {
      merged[key] = fragment[key];
    }
  }
  return merged;
}
