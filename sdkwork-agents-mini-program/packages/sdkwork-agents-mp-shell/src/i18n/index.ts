/**
 * Thin i18n boundary for the Agents mini program shell package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1). This module only types, resolves, and re-exports
 * them; it deliberately does not read the platform locale — the host injects the
 * active locale (`I18N_SPEC.md` section 7).
 *
 * The fragments cover the shell chrome (tab labels, navigation) and the M1
 * primary surfaces whose capability services are composed in the application
 * root, so a page never has to assemble its own dictionary.
 */

import { agentsMpAssetsEnUs } from "./en-US/agents/assets";
import { agentsMpCanvasEnUs } from "./en-US/agents/canvas";
import { agentsMpCreativeEnUs } from "./en-US/agents/creative";
import { agentsMpInspirationEnUs } from "./en-US/agents/inspiration";
import { agentsMpMembershipEnUs } from "./en-US/agents/membership";
import { agentsMpProfileEnUs } from "./en-US/agents/profile";
import { agentsMpSettingsEnUs } from "./en-US/agents/settings";
import { agentsMpShellNavigationEnUs } from "./en-US/agents/shell/navigation";
import { agentsMpShellTabsEnUs } from "./en-US/agents/shell/tabs";
import { agentsMpAssetsZhCn } from "./zh-CN/agents/assets";
import { agentsMpCanvasZhCn } from "./zh-CN/agents/canvas";
import { agentsMpCreativeZhCn } from "./zh-CN/agents/creative";
import { agentsMpInspirationZhCn } from "./zh-CN/agents/inspiration";
import { agentsMpMembershipZhCn } from "./zh-CN/agents/membership";
import { agentsMpProfileZhCn } from "./zh-CN/agents/profile";
import { agentsMpSettingsZhCn } from "./zh-CN/agents/settings";
import { agentsMpShellNavigationZhCn } from "./zh-CN/agents/shell/navigation";
import { agentsMpShellTabsZhCn } from "./zh-CN/agents/shell/tabs";

export type AgentsMpShellLocale = "zh-CN" | "en-US";

export type AgentsMpShellMessages = Record<string, string>;

export const AGENTS_MP_SHELL_MESSAGES: Record<AgentsMpShellLocale, AgentsMpShellMessages> = {
  "zh-CN": {
    ...agentsMpShellTabsZhCn,
    ...agentsMpShellNavigationZhCn,
    ...agentsMpInspirationZhCn,
    ...agentsMpCreativeZhCn,
    ...agentsMpAssetsZhCn,
    ...agentsMpCanvasZhCn,
    ...agentsMpMembershipZhCn,
    ...agentsMpProfileZhCn,
    ...agentsMpSettingsZhCn,
  },
  "en-US": {
    ...agentsMpShellTabsEnUs,
    ...agentsMpShellNavigationEnUs,
    ...agentsMpInspirationEnUs,
    ...agentsMpCreativeEnUs,
    ...agentsMpAssetsEnUs,
    ...agentsMpCanvasEnUs,
    ...agentsMpMembershipEnUs,
    ...agentsMpProfileEnUs,
    ...agentsMpSettingsEnUs,
  },
};

/** Default locale of the mobile shell when the host injects none. */
export const DEFAULT_AGENTS_MP_SHELL_LOCALE: AgentsMpShellLocale = "zh-CN";

let activeAgentsMpShellLocale: AgentsMpShellLocale = DEFAULT_AGENTS_MP_SHELL_LOCALE;

/** Host injection point for the active locale. */
export function configureAgentsMpShellLocale(locale: AgentsMpShellLocale): void {
  activeAgentsMpShellLocale = locale;
}

export function getAgentsMpShellLocale(): AgentsMpShellLocale {
  return activeAgentsMpShellLocale;
}

/** Normalizes a BCP 47 tag (or WeChat `language`) onto a supported locale. */
export function normalizeAgentsMpShellLocale(tag: string | null | undefined): AgentsMpShellLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function resolveAgentsMpShellMessages(
  locale: AgentsMpShellLocale = activeAgentsMpShellLocale,
): AgentsMpShellMessages {
  return AGENTS_MP_SHELL_MESSAGES[locale] ?? AGENTS_MP_SHELL_MESSAGES[DEFAULT_AGENTS_MP_SHELL_LOCALE];
}

/**
 * Translates a shell key, interpolating `{{name}}` placeholders and falling back
 * to the key itself.
 */
export function translateAgentsMpShellText(
  key: string,
  params?: Record<string, string>,
  locale: AgentsMpShellLocale = activeAgentsMpShellLocale,
): string {
  const messages = resolveAgentsMpShellMessages(locale);
  const template = messages[key] ?? key;
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (value, [name, replacement]) => value.replaceAll(`{{${name}}}`, replacement),
    template,
  );
}
