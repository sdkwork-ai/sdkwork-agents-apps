/**
 * Appbase IAM runtime wiring for the HarmonyOS root.
 *
 * Authority: `APP_SDK_INTEGRATION_SPEC.md` and `IAM_LOGIN_INTEGRATION_SPEC.md`.
 *
 * The global token-manager equivalent is shared by the appbase app SDK, every
 * authenticated app-api SDK client, and explicit backend-admin clients.
 * Logout and refresh failure must clear the token manager, session/context
 * stores, secure platform storage, and realtime bridges.
 */

export interface AgentsHarmonyIamRuntime {
  isAuthenticated(): boolean;
  clearOnLogout(): void;
}

export class AgentsHarmonyIamRuntimeImpl implements AgentsHarmonyIamRuntime {
  private authenticated: boolean = false;

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  clearOnLogout(): void {
    this.authenticated = false;
  }
}

let iamRuntime: AgentsHarmonyIamRuntime | null = null;

export function createAgentsHarmonyIamRuntime(): AgentsHarmonyIamRuntime {
  iamRuntime = new AgentsHarmonyIamRuntimeImpl();
  return iamRuntime;
}

export function getAgentsHarmonyIamRuntime(): AgentsHarmonyIamRuntime {
  if (iamRuntime === null) {
    return createAgentsHarmonyIamRuntime();
  }
  return iamRuntime;
}
