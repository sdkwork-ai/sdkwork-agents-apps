/**
 * Package-local i18n resource helpers.
 *
 * Authority: `I18N_SPEC.md`. Platform monolithic resources must be assembled
 * from fragments and must not be hand-authored whole-root catalogs.
 */
export type AgentsHarmonyLocale = 'en-US' | 'zh-CN';

export function normalizeAgentsHarmonyLocale(value: string): AgentsHarmonyLocale {
  return value.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}
