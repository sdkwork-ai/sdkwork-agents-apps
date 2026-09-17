/**
 * HarmonyOS runtime environment resolution.
 *
 * Authority: `config/app/runtime-env.<deploymentProfile>.<environment>.json`
 * (see `CONFIG_SPEC.md` and `ENVIRONMENT_SPEC.md`). The build projects exactly
 * one selected non-secret runtime JSON resource; this module only reads it.
 */

export type AgentsHarmonyRuntimeTarget = 'harmony-native';

export interface AgentsHarmonyEnvironment {
  readonly environment: string;
  readonly deploymentProfile: string;
  readonly profileId: string;
  readonly runtimeTarget: AgentsHarmonyRuntimeTarget;
  readonly agentsApiBaseUrl: string;
  readonly agentsBackendApiBaseUrl: string;
  readonly appbaseAppApiBaseUrl: string;
  readonly appbaseLoginUrl: string;
}

const APP_API_SUFFIX: string = '/app/v3/api';

function requireNonEmpty(value: string | undefined, key: string): string {
  const normalized: string = value === undefined ? '' : value.trim();
  if (normalized.length === 0) {
    throw new Error(`${key} is required by the HarmonyOS runtime config`);
  }
  return normalized;
}

function stripTrailingSlashes(value: string): string {
  let normalized: string = value.trim();
  while (normalized.endsWith('/')) {
    normalized = normalized.slice(0, normalized.length - 1);
  }
  return normalized;
}

export function normalizeAgentsAppApiBaseUrl(value: string): string {
  const normalized: string = stripTrailingSlashes(requireNonEmpty(value, 'agents.apiBaseUrl'));
  if (!normalized.endsWith(APP_API_SUFFIX)) {
    throw new Error(`agents.apiBaseUrl must end with ${APP_API_SUFFIX}`);
  }
  const prefix: string = normalized.slice(0, normalized.length - APP_API_SUFFIX.length);
  if (prefix.endsWith(APP_API_SUFFIX)) {
    throw new Error(`agents.apiBaseUrl must contain ${APP_API_SUFFIX} exactly once`);
  }
  return normalized;
}

export function createAgentsHarmonyEnvironment(
  runtimeConfig: Record<string, Object>,
): AgentsHarmonyEnvironment {
  const agents: Record<string, Object> = runtimeConfig.agents as Record<string, Object>;
  const appbase: Record<string, Object> = runtimeConfig.appbase as Record<string, Object>;
  const target: string = requireNonEmpty(runtimeConfig.runtimeTarget as string, 'runtimeTarget');
  if (target !== 'harmony-native') {
    throw new Error('runtimeTarget must be harmony-native for this application root');
  }
  return {
    environment: requireNonEmpty(runtimeConfig.environment as string, 'environment'),
    deploymentProfile: requireNonEmpty(runtimeConfig.deploymentProfile as string, 'deploymentProfile'),
    profileId: requireNonEmpty(runtimeConfig.profileId as string, 'profileId'),
    runtimeTarget: 'harmony-native',
    agentsApiBaseUrl: normalizeAgentsAppApiBaseUrl(agents.apiBaseUrl as string),
    agentsBackendApiBaseUrl: requireNonEmpty(agents.backendApiBaseUrl as string, 'agents.backendApiBaseUrl'),
    appbaseAppApiBaseUrl: requireNonEmpty(appbase.appApiBaseUrl as string, 'appbase.appApiBaseUrl'),
    appbaseLoginUrl: requireNonEmpty(appbase.loginUrl as string, 'appbase.loginUrl'),
  };
}
