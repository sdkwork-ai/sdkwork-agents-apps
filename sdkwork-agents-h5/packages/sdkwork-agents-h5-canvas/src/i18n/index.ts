/**
 * Thin i18n boundary for the canvas capability package.
 *
 * Authored copy lives in the per-locale fragments next to this file
 * (`I18N_SPEC.md` section 6.1); the host injects the active locale.
 */

import { agentsCanvasBoardEnUs } from "./en-US/agents/canvas/board";
import { agentsCanvasBoardZhCn } from "./zh-CN/agents/canvas/board";

export type AgentsCanvasLocale = "zh-CN" | "en-US";

export type AgentsCanvasMessageKey =
  | keyof typeof agentsCanvasBoardZhCn
  | keyof typeof agentsCanvasBoardEnUs;

export type AgentsCanvasMessages = Record<string, string>;

export const AGENTS_CANVAS_MESSAGES: Record<AgentsCanvasLocale, AgentsCanvasMessages> = {
  "zh-CN": agentsCanvasBoardZhCn,
  "en-US": agentsCanvasBoardEnUs,
};

export const DEFAULT_AGENTS_CANVAS_LOCALE: AgentsCanvasLocale = "zh-CN";

let activeLocale: AgentsCanvasLocale = DEFAULT_AGENTS_CANVAS_LOCALE;

export function configureAgentsCanvasLocale(locale: AgentsCanvasLocale): void {
  activeLocale = locale;
}

export function getAgentsCanvasLocale(): AgentsCanvasLocale {
  return activeLocale;
}

export function normalizeAgentsCanvasLocale(tag: string | null | undefined): AgentsCanvasLocale {
  return typeof tag === "string" && tag.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

export function translateAgentsCanvasText(
  key: AgentsCanvasMessageKey | string,
  params?: Record<string, string | number>,
  locale: AgentsCanvasLocale = activeLocale,
): string {
  const template =
    AGENTS_CANVAS_MESSAGES[locale]?.[key] ??
    AGENTS_CANVAS_MESSAGES[DEFAULT_AGENTS_CANVAS_LOCALE][key] ??
    key;
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
    template,
  );
}
