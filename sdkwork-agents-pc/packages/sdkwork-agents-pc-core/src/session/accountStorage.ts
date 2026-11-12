/**
 * Account-scoped browser storage for the Agents PC surfaces.
 *
 * Browser storage is shared by every account that signs in on the same origin,
 * and an Electron profile keeps it across sign-outs too. A bare key therefore
 * leaks the previous account's canvas graph, drafts, prompt history and BYO
 * model credentials into the next account. Every persisted user-content key
 * carries `<baseKey>::<tenantId>:<userId>`, resolved from the app session, and
 * the session store clears the previous scope whenever the identity changes or
 * the session ends.
 *
 * Device preferences (theme, language, layout, selected model, wire protocol)
 * are intentionally NOT scoped: they describe this browser, not the account.
 */

export interface AgentsAccountScope {
  tenantId: string;
  userId: string;
}

/** Session key written by `session.ts`; read here so storage can scope itself. */
export const AGENTS_SESSION_STORAGE_KEY = 'sdkwork-agents-pc:session:v1';

/** Scope id used while no tenant/user claims are available. */
export const ANONYMOUS_ACCOUNT_SCOPE = 'anonymous';

const SCOPE_SUFFIX_SEPARATOR = '::';

/**
 * Base keys (or base-key prefixes, for per-conversation keys) whose values are
 * account data. Keys outside this list are device preferences and stay shared.
 */
export const ACCOUNT_SCOPED_KEY_PREFIXES = [
  'sdkwork_agents_canvas_workflow_v1',
  'sdkwork_agents_canvas_snapshots_v1',
  'sdkwork_agents_canvas_templates_v1',
  'chat_input_draft',
  'creative_input_draft',
  'creative_prompt_history_logs',
  'creative_session_title:',
  'creative_session_pinned:',
  'creative_session_hidden:',
  'creative_hidden_record_ids',
  'profile_',
] as const;

/** `undefined` means "derive from the persisted session"; `null` means anonymous. */
let scopeOverride: AgentsAccountScope | null | undefined;
let activeScopeId: string | null = null;

function getStorage(): Storage | undefined {
  try {
    return (globalThis as { localStorage?: Storage }).localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

function parsePersistedScope(raw: string | null): AgentsAccountScope | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as {
      context?: { tenantId?: unknown; userId?: unknown };
    };
    const tenantId = typeof parsed.context?.tenantId === 'string'
      ? parsed.context.tenantId.trim()
      : '';
    const userId = typeof parsed.context?.userId === 'string'
      ? parsed.context.userId.trim()
      : '';
    return tenantId && userId ? { tenantId, userId } : null;
  } catch {
    return null;
  }
}

export function readAgentsAccountScope(): AgentsAccountScope | null {
  if (scopeOverride !== undefined) {
    return scopeOverride;
  }
  try {
    return parsePersistedScope(getStorage()?.getItem(AGENTS_SESSION_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

/** Scope id embedded in storage keys: `<tenantId>:<userId>` or `anonymous`. */
export function agentsAccountScopeId(scope: AgentsAccountScope | null = readAgentsAccountScope()): string {
  return scope ? `${scope.tenantId}:${scope.userId}` : ANONYMOUS_ACCOUNT_SCOPE;
}

export function scopedAccountStorageKey(
  baseKey: string,
  scopeId: string = agentsAccountScopeId(),
): string {
  return `${baseKey}${SCOPE_SUFFIX_SEPARATOR}${scopeId}`;
}

export function isAccountScopedBaseKey(baseKey: string): boolean {
  return ACCOUNT_SCOPED_KEY_PREFIXES.some((prefix) => baseKey.startsWith(prefix));
}

export function readAccountScopedItem(baseKey: string): string | null {
  try {
    return getStorage()?.getItem(scopedAccountStorageKey(baseKey)) ?? null;
  } catch {
    return null;
  }
}

export function writeAccountScopedItem(baseKey: string, value: string): void {
  try {
    getStorage()?.setItem(scopedAccountStorageKey(baseKey), value);
  } catch {
    // Quota / private mode: the in-memory state still works for this session.
  }
}

export function removeAccountScopedItem(baseKey: string): void {
  try {
    getStorage()?.removeItem(scopedAccountStorageKey(baseKey));
  } catch {
    // Nothing to remove when storage is unavailable.
  }
}

function listStorageKeys(store: Storage): string[] {
  const keys: string[] = [];
  try {
    const length = typeof store.length === 'number' ? store.length : 0;
    for (let index = 0; index < length; index += 1) {
      const key = store.key(index);
      if (key) {
        keys.push(key);
      }
    }
  } catch {
    return keys;
  }
  return keys;
}

/**
 * Remove account-scoped values for the given scopes.
 *
 * Legacy unscoped keys are dropped as well: they cannot be attributed to an
 * account, so showing them to whoever signs in next is exactly the defect this
 * module removes. Returns the removed keys so callers/tests can assert.
 */
export function clearAccountScopedStorage(scopeIds: readonly string[]): string[] {
  const store = getStorage();
  const removed: string[] = [];
  if (!store || scopeIds.length === 0) {
    return removed;
  }
  const suffixes = scopeIds.map((scopeId) => `${SCOPE_SUFFIX_SEPARATOR}${scopeId}`);
  for (const key of listStorageKeys(store)) {
    const matchedSuffix = suffixes.find((suffix) => key.endsWith(suffix));
    if (matchedSuffix) {
      const baseKey = key.slice(0, -matchedSuffix.length);
      if (!isAccountScopedBaseKey(baseKey)) {
        continue;
      }
      store.removeItem(key);
      removed.push(key);
      continue;
    }
    if (key.includes(SCOPE_SUFFIX_SEPARATOR) || !isAccountScopedBaseKey(key)) {
      continue;
    }
    store.removeItem(key);
    removed.push(key);
  }
  return removed;
}

/**
 * Point storage at the session's scope, clearing the previous account's values
 * when the identity actually changed. Called by the session store on every
 * persist/clear so an account switch never leaves data visible to the next one.
 */
export function syncAgentsAccountScope(scope: AgentsAccountScope | null): void {
  const nextScopeId = agentsAccountScopeId(scope);
  const previousScopeId = activeScopeId ?? agentsAccountScopeId(readAgentsAccountScope());
  if (previousScopeId !== nextScopeId && previousScopeId !== ANONYMOUS_ACCOUNT_SCOPE) {
    // A different account is taking over: its predecessor's data must never be
    // readable from the new scope. The anonymous bucket is kept so a draft typed
    // before signing in survives the sign-in, and is cleared on sign-out.
    clearAccountScopedStorage([previousScopeId]);
  }
  scopeOverride = scope;
  activeScopeId = nextScopeId;
}

/** Clear this session's account data (and the anonymous bucket) on sign-out. */
export function clearActiveAccountScopedStorage(): string[] {
  const scopeId = activeScopeId ?? agentsAccountScopeId(readAgentsAccountScope());
  const removed = clearAccountScopedStorage([scopeId, ANONYMOUS_ACCOUNT_SCOPE]);
  activeScopeId = null;
  scopeOverride = undefined;
  return removed;
}

/** Test hook: forget module-level scope state between cases. */
export function resetAgentsAccountScopeForTests(): void {
  scopeOverride = undefined;
  activeScopeId = null;
}
