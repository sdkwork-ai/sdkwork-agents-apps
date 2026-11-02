/**
 * Membership app SDK client for the Agents mini program.
 *
 * Construction belongs to `core`; capability services receive the port wired by
 * the mini program compose root.
 */

import {
  createClient,
  type SdkworkAppClient as GeneratedMembershipAppClient,
  type SdkworkAppConfig,
} from "@sdkwork/membership-app-sdk";

import {
  readAppSdkSessionTokens,
  resolveAppSdkAccessToken,
  resolveAppSdkAuthToken,
  type SdkworkAgentsMpSession,
} from "../session/session";
import { resolveAgentsAppSdkBaseUrl } from "./agentsAppSdkClient";

export type SdkworkAgentsMpMembershipAppClient = GeneratedMembershipAppClient;
export type SdkworkAgentsMpMembershipAppClientConfig = SdkworkAppConfig;

let membershipAppSdkClient: SdkworkAgentsMpMembershipAppClient | null = null;

export function createMembershipAppSdkClientConfig(
  session?: SdkworkAgentsMpSession | null,
): SdkworkAgentsMpMembershipAppClientConfig {
  const currentSession = session ?? readAppSdkSessionTokens();
  return {
    baseUrl: resolveAgentsAppSdkBaseUrl(),
    accessToken: resolveAppSdkAccessToken(currentSession),
    authToken: resolveAppSdkAuthToken(currentSession),
    platform: "mini-program",
  };
}

export function initMembershipAppSdkClient(
  config: SdkworkAgentsMpMembershipAppClientConfig = createMembershipAppSdkClientConfig(),
): SdkworkAgentsMpMembershipAppClient {
  membershipAppSdkClient = createClient(config);
  return membershipAppSdkClient;
}

export function getMembershipAppSdkClient(): SdkworkAgentsMpMembershipAppClient {
  return membershipAppSdkClient ?? initMembershipAppSdkClient();
}

export function resetMembershipAppSdkClient(): void {
  membershipAppSdkClient = null;
}
