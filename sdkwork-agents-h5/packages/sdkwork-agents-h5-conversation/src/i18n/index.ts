/**
 * Thin i18n boundary for the conversation capability package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1). This module only types, resolves, and re-exports;
 * the host injects the active locale instead of the package reading
 * `navigator.language` (`I18N_SPEC.md` section 7).
 */

import { agentsConversationChatEnUs } from "./en-US/agents/conversation/chat";
import { agentsConversationChatZhCn } from "./zh-CN/agents/conversation/chat";

export type AgentsConversationLocale = "zh-CN" | "en-US";

export type AgentsConversationMessageKey =
  | keyof typeof agentsConversationChatZhCn
  | keyof typeof agentsConversationChatEnUs;

export type AgentsConversationMessages = Record<string, string>;

export const AGENTS_CONVERSATION_MESSAGES: Record<
  AgentsConversationLocale,
  AgentsConversationMessages
> = {
  "zh-CN": agentsConversationChatZhCn,
  "en-US": agentsConversationChatEnUs,
};

export const DEFAULT_AGENTS_CONVERSATION_LOCALE: AgentsConversationLocale = "zh-CN";

let activeLocale: AgentsConversationLocale = DEFAULT_AGENTS_CONVERSATION_LOCALE;

/** Host injection point for the active locale. */
export function configureAgentsConversationLocale(locale: AgentsConversationLocale): void {
  activeLocale = locale;
}

export function getAgentsConversationLocale(): AgentsConversationLocale {
  return activeLocale;
}

/** Normalizes a BCP 47 tag onto a supported conversation locale. */
export function normalizeAgentsConversationLocale(
  tag: string | null | undefined,
): AgentsConversationLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function resolveAgentsConversationMessages(
  locale: AgentsConversationLocale = activeLocale,
): AgentsConversationMessages {
  return (
    AGENTS_CONVERSATION_MESSAGES[locale] ??
    AGENTS_CONVERSATION_MESSAGES[DEFAULT_AGENTS_CONVERSATION_LOCALE]
  );
}

/**
 * Translates a conversation key. Supports `{{name}}` interpolation so callers
 * never concatenate localized fragments by hand.
 */
export function translateAgentsConversationText(
  key: AgentsConversationMessageKey | string,
  params?: Record<string, string>,
  locale?: AgentsConversationLocale,
): string {
  const template = resolveAgentsConversationMessages(locale)[key] ?? key;
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, value),
    template,
  );
}
