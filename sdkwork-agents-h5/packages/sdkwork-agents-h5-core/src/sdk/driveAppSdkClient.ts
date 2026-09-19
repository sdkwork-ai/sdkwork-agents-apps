import { createClient, type SdkworkDriveAppClient } from "@sdkwork/drive-app-sdk";
import type { SdkworkAppConfig } from "@sdkwork/drive-app-sdk";
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
import { readRuntimeEnv } from "./runtimeEnv";

export type SdkworkAgentsDriveAppClient = SdkworkDriveAppClient;
export type SdkworkAgentsDriveAppClientConfig = SdkworkAppConfig & {
  interceptors?: Interceptors;
};

/**
 * Drive node property marking a node as part of the Agents file library.
 * Mirrors the PC workbench key so both roots read one library.
 */
export const CHAT_FILE_LIBRARY_PROPERTY_KEY = "agents.chat_file_library";

let driveAppSdkClient: SdkworkAgentsDriveAppClient | null = null;

export function resolveDriveAppSdkBaseUrl(): string {
  // Same shared, protocol-adaptive base-url key as the Agents client so the H5
  // root never forks API origins per SDK family.
  return resolveBaseUrl({
    envKey: "SDKWORK_API_BASE_URL",
    preservePath: true,
  }).url;
}

export function createDriveAppSdkClientConfig(
  session?: SdkworkChatSession | null,
): SdkworkAgentsDriveAppClientConfig {
  const currentSession = session ?? readAppSdkSessionTokens();
  const envAccessToken = readRuntimeEnv("SDKWORK_ACCESS_TOKEN");
  return {
    baseUrl: resolveDriveAppSdkBaseUrl(),
    accessToken: resolveAppSdkAccessToken(currentSession) ?? envAccessToken,
    authToken: resolveAppSdkAuthToken(currentSession),
    interceptors: createSdkworkChatRequestContextInterceptors(
      () => readAppSdkSessionTokens() ?? currentSession,
    ),
    platform: "h5",
    tokenManager: getSdkworkChatGlobalTokenManager(),
  };
}

export function initDriveAppSdkClient(
  config: SdkworkAgentsDriveAppClientConfig = createDriveAppSdkClientConfig(),
): SdkworkAgentsDriveAppClient {
  driveAppSdkClient = createClient(config);
  return driveAppSdkClient;
}

export function getDriveAppSdkClient(): SdkworkAgentsDriveAppClient {
  return driveAppSdkClient ?? initDriveAppSdkClient();
}

export function getDriveAppSdkClientWithSession(
  session = readAppSdkSessionTokens(),
): SdkworkAgentsDriveAppClient {
  return initDriveAppSdkClient(createDriveAppSdkClientConfig(session));
}

export function resetDriveAppSdkClient(): void {
  driveAppSdkClient = null;
}
