/**
 * Membership app SDK client for the Agents H5 root.
 *
 * Construction belongs to `core`; capability packages receive the port the
 * composition root wires from this client (`APP_SDK_INTEGRATION_SPEC.md`).
 */

import {
  createClient,
  type AppMembershipInfoResponse,
  type AppMembershipPackageGroupItem,
  type AppMembershipPackageItem,
  type SdkworkAppClient as GeneratedMembershipAppClient,
  type SdkworkAppConfig,
} from "@sdkwork/membership-app-sdk";
import { resolveBaseUrl } from "@sdkwork/sdk-common";
import type { Interceptors } from "@sdkwork/sdk-common";

import {
  createSdkworkChatRequestContextInterceptors,
  getSdkworkChatGlobalTokenManager,
  readAppSdkSessionTokens,
  resolveAppSdkAccessToken,
  resolveAppSdkAuthToken,
  type SdkworkChatSession,
} from "../session/session";

export type SdkworkAgentsMembershipAppClient = GeneratedMembershipAppClient;
export type SdkworkAgentsMembershipAppClientConfig = SdkworkAppConfig & {
  interceptors?: Interceptors;
};

let membershipAppSdkClient: SdkworkAgentsMembershipAppClient | null = null;

export function resolveMembershipAppSdkBaseUrl(): string {
  return resolveBaseUrl({
    envKey: "SDKWORK_API_BASE_URL",
    preservePath: true,
  }).url;
}

export function createMembershipAppSdkClientConfig(
  session?: SdkworkChatSession | null,
): SdkworkAgentsMembershipAppClientConfig {
  const currentSession = session ?? readAppSdkSessionTokens();
  return {
    baseUrl: resolveMembershipAppSdkBaseUrl(),
    accessToken: resolveAppSdkAccessToken(currentSession),
    authToken: resolveAppSdkAuthToken(currentSession),
    interceptors: createSdkworkChatRequestContextInterceptors(
      () => readAppSdkSessionTokens() ?? currentSession,
    ),
    platform: "h5",
    tokenManager: getSdkworkChatGlobalTokenManager(),
  };
}

export function initMembershipAppSdkClient(
  config: SdkworkAgentsMembershipAppClientConfig = createMembershipAppSdkClientConfig(),
): SdkworkAgentsMembershipAppClient {
  membershipAppSdkClient = createClient(config);
  return membershipAppSdkClient;
}

export function getMembershipAppSdkClient(): SdkworkAgentsMembershipAppClient {
  return membershipAppSdkClient ?? initMembershipAppSdkClient();
}

export function getMembershipAppSdkClientWithSession(
  session = readAppSdkSessionTokens(),
): SdkworkAgentsMembershipAppClient {
  return initMembershipAppSdkClient(createMembershipAppSdkClientConfig(session));
}

export function resetMembershipAppSdkClient(): void {
  membershipAppSdkClient = null;
}

export type {
  AppMembershipInfoResponse,
  AppMembershipPackageGroupItem,
  AppMembershipPackageItem,
};
