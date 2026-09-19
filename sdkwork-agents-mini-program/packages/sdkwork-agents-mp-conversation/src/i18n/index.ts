/**
 * Thin i18n boundary for the conversation capability.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1). This module only types, resolves, and re-exports
 * them; the host injects the active locale (`I18N_SPEC.md` section 7).
 */

import { agentsMpConversationChatEnUs } from "./en-US/agents/conversation/chat";
import { agentsMpConversationChatZhCn } from "./zh-CN/agents/conversation/chat";

export type AgentsMpConversationLocale = "zh-CN" | "en-US";

export type AgentsMpConversationMessageKey =
  | keyof typeof agentsMpConversationChatZhCn
  | keyof typeof agentsMpConversationChatEnUs;

export const AGENTS_MP_CONVERSATION_MESSAGES: Record<
  AgentsMpConversationLocale,
  Record<string, string>
> = {
  "zh-CN": agentsMpConversationChatZhCn,
  "en-US": agentsMpConversationChatEnUs,
};

export const DEFAULT_AGENTS_MP_CONVERSATION_LOCALE: AgentsMpConversationLocale = "zh-CN";

let activeLocale: AgentsMpConversationLocale = DEFAULT_AGENTS_MP_CONVERSATION_LOCALE;

/** Host injection point for the active locale. */
export function configureAgentsMpConversationLocale(locale: AgentsMpConversationLocale): void {
  activeLocale = locale;
}

export function getAgentsMpConversationLocale(): AgentsMpConversationLocale {
  return activeLocale;
}

export function normalizeAgentsMpConversationLocale(
  tag: string | null | undefined,
): AgentsMpConversationLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

/** Translates a conversation key, falling back to the key itself. */
export function translateAgentsMpConversationText(
  key: string,
  locale: AgentsMpConversationLocale = activeLocale,
): string {
  return (
    AGENTS_MP_CONVERSATION_MESSAGES[locale]?.[key] ??
    AGENTS_MP_CONVERSATION_MESSAGES[DEFAULT_AGENTS_MP_CONVERSATION_LOCALE][key] ??
    key
  );
}
