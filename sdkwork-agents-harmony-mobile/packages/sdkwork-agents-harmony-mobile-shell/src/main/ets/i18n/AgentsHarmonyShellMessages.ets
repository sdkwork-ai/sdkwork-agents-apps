import {
  type AgentsHarmonyLocale,
  type AgentsHarmonyMessageCatalog,
  mergeAgentsHarmonyCatalogs,
  AGENTS_HARMONY_FALLBACK_LOCALE,
  normalizeAgentsHarmonyLocale,
} from '@sdkwork/sdkwork-agents-harmony-mobile-commons';

import { agentsShellTabsEnUs } from './en-US/agents/shell/tabs';
import { agentsShellTabsZhCn } from './zh-CN/agents/shell/tabs';

/**
 * Shell locale store and message facade.
 *
 * Authority: `I18N_SPEC.md` section 7 — the root resolves one runtime locale at
 * bootstrap (through a host adapter) and feature packages consume it; feature
 * packages must not parse platform locale independently.
 *
 * Authored copy lives in the locale fragments beside this file. This module is a
 * thin aggregator plus lookup facade only.
 */

export const agentsShellEnUsMessages: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsShellTabsEnUs]);

export const agentsShellZhCnMessages: AgentsHarmonyMessageCatalog =
  mergeAgentsHarmonyCatalogs([agentsShellTabsZhCn]);

let currentLocale: AgentsHarmonyLocale = AGENTS_HARMONY_FALLBACK_LOCALE;

/** Installs the resolved runtime locale. Called by root composition only. */
export function configureAgentsHarmonyLocale(locale: string): void {
  currentLocale = normalizeAgentsHarmonyLocale(locale);
}

export function getAgentsHarmonyLocale(): AgentsHarmonyLocale {
  return currentLocale;
}

/** Resolves one shell message key in the active locale. */
export function agentsShellMessage(key: string): string {
  const catalog: AgentsHarmonyMessageCatalog =
    currentLocale === 'en-US' ? agentsShellEnUsMessages : agentsShellZhCnMessages;
  const message: string | undefined = catalog[key];
  return message === undefined ? key : message;
}

/** Resolves a message key from an arbitrary package fragment pair. */
export function agentsLocalizedMessage(
  zhCn: AgentsHarmonyMessageCatalog,
  enUs: AgentsHarmonyMessageCatalog,
  key: string,
): string {
  const catalog: AgentsHarmonyMessageCatalog = currentLocale === 'en-US' ? enUs : zhCn;
  const message: string | undefined = catalog[key];
  return message === undefined ? key : message;
}
