/**
 * Session and context store.
 *
 * Authority: `APP_SDK_INTEGRATION_SPEC.md`. Logout, refresh failure, tenant
 * switch, and account switch must clear this store together with the token
 * manager, secure platform storage, and realtime/session bridges.
 */

export interface AgentsHarmonySession {
  readonly accessToken?: string;
  readonly authToken?: string;
  readonly tenantId?: string;
}

let currentSession: AgentsHarmonySession | null = null;

export function readAgentsHarmonySession(): AgentsHarmonySession | null {
  return currentSession;
}

export function writeAgentsHarmonySession(session: AgentsHarmonySession | null): void {
  currentSession = session;
}

export function clearAgentsHarmonySession(): void {
  currentSession = null;
}
