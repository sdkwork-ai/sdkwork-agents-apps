/**
 * The runtime model catalog's data shape and its display labels.
 *
 * Kept apart from `RuntimeCatalogService` on purpose: that module owns the
 * network client, so importing it drags in the whole agents app SDK. The
 * catalog *shape* is what the pure UI-adaptation code (and its tests) needs, and
 * a plain data module can be imported anywhere without a session, a DOM, or a
 * generated client behind it.
 */

/**
 * One model published by an agent engine.
 *
 * `engineKey` names the runtime that serves the model; `providerId` is the
 * runtime binding identity the session layer uses (`provider.<engine>`), not a
 * UI vendor axis.
 */
export interface ModelCatalogItem {
  id: string;
  label: string;
  description: string;
  providerId: string;
  engineKey: string;
  bindingId: string;
  defaultForEngine: boolean;
}

/** Human label for an agent engine, for the surfaces that list engines. */
export function engineKeyToVendorLabel(engineKey: string): string {
  const labels: Record<string, string> = {
    codex: 'OpenAI Codex',
    'claude-code': 'Anthropic',
    gemini: 'Google',
    opencode: 'OpenCode',
    openclaw: 'OpenClaw',
    hermes: 'Hermes',
    'mimo-code': 'MiMo Code',
    rig: 'Rig',
  };
  return labels[engineKey] ?? engineKey;
}
