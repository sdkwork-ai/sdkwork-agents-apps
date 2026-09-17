/**
 * Agents app-api SDK port and factory contract.
 *
 * Authority: `APP_SDK_INTEGRATION_SPEC.md` and
 * `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 6.
 *
 * The Harmony root consumes `/app/v3/api` through a generated
 * ArkTS/TypeScript app SDK client adapted for the Harmony runtime. This file
 * owns the injected port contract, the base-URL normalization, and the
 * credential resolution boundary. Concrete transport construction stays in
 * the root bootstrap.
 *
 * PREREQUISITE: the SDK generation chain currently emits TypeScript and
 * Flutter targets of `sdkwork-agents-app-sdk` only. No ArkTS target exists
 * yet, so this module deliberately declares the port and the adapter seam
 * instead of vendoring a transport copy. Feature packages must never fill
 * this gap with raw request APIs or manual auth headers.
 */

export interface AgentsAppSdkClientConfig {
  readonly baseUrl: string;
  readonly accessToken?: string;
  readonly authToken?: string;
  readonly platform?: string;
}

export interface AgentsAppSdkClient {
  readonly baseUrl: string;
  readonly platform: string;
}

const APP_API_SUFFIX: string = '/app/v3/api';

let configuredBaseUrl: string | null = null;

export function configureAgentsAppSdkBaseUrl(baseUrl: string): void {
  const normalized: string = baseUrl.trim().replace(/\/+$/u, '');
  if (normalized.length === 0) {
    throw new Error('agents app API base URL is required before SDK bootstrap');
  }
  if (!normalized.endsWith(APP_API_SUFFIX)) {
    throw new Error(`agents app API base URL must end with ${APP_API_SUFFIX}`);
  }
  configuredBaseUrl = normalized;
}

export function resolveAgentsAppSdkBaseUrl(): string {
  if (configuredBaseUrl === null) {
    throw new Error('agents app API base URL must be configured before SDK bootstrap');
  }
  return configuredBaseUrl;
}

export function createAgentsAppSdkClientConfig(
  baseUrl: string,
  accessToken?: string,
  authToken?: string,
): AgentsAppSdkClientConfig {
  configureAgentsAppSdkBaseUrl(baseUrl);
  return {
    baseUrl: resolveAgentsAppSdkBaseUrl(),
    accessToken,
    authToken,
    platform: 'harmony-native',
  };
}

const agentsAppSdkClient: AgentsAppSdkClient | null = null;

export function getAgentsAppSdkClient(config?: AgentsAppSdkClientConfig): AgentsAppSdkClient {
  const resolved: AgentsAppSdkClientConfig = config ?? createAgentsAppSdkClientConfig(resolveAgentsAppSdkBaseUrl());
  return agentsAppSdkClient ?? {
    baseUrl: resolved.baseUrl,
    platform: resolved.platform ?? 'harmony-native',
  };
}

export function resetAgentsAppSdkClient(): void {
  configuredBaseUrl = null;
}
