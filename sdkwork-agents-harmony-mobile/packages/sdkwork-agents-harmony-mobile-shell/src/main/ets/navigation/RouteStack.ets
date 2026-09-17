/**
 * Page/route stack assembly for the HarmonyOS shell.
 *
 * Route ids follow `<surface>.<domain>.<capability>.<screen>`. Physical Harmony
 * page paths may differ from other platforms while route ids stay aligned.
 */
export interface AgentsHarmonyRouteRegistration {
  readonly id: string;
  readonly pagePath: string;
  readonly titleKey: string;
  readonly auth: 'public' | 'required';
}

export function createAgentsHarmonyRouteStack(routes: AgentsHarmonyRouteRegistration[]): AgentsHarmonyRouteRegistration[] {
  return routes.filter((route) => route.pagePath.trim().length > 0);
}
