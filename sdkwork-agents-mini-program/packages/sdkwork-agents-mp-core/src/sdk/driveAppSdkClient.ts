import { createClient, type SdkworkDriveAppClient } from "@sdkwork/drive-app-sdk";
import type { SdkworkAppConfig } from "@sdkwork/drive-app-sdk";

import {
  readAppSdkSessionTokens,
  resolveAppSdkAccessToken,
  resolveAppSdkAuthToken,
  type SdkworkAgentsMpSession,
} from "../session/session";
import { resolveAgentsAppSdkBaseUrl } from "./agentsAppSdkClient";

export type SdkworkAgentsMpDriveAppClient = SdkworkDriveAppClient;
export type SdkworkAgentsMpDriveAppClientConfig = SdkworkAppConfig;

/**
 * Drive node property marking a node as part of the Agents file library.
 * Mirrors the PC and H5 roots' key so every client reads one library.
 */
export const CHAT_FILE_LIBRARY_PROPERTY_KEY = "agents.chat_file_library";

let driveAppSdkClient: SdkworkAgentsMpDriveAppClient | null = null;

export function createDriveAppSdkClientConfig(
  session?: SdkworkAgentsMpSession | null,
): SdkworkAgentsMpDriveAppClientConfig {
  const currentSession = session ?? readAppSdkSessionTokens();
  return {
    // One shared app-api ingress: the Drive app API is same-origin with the
    // Agents app API on the standalone gateway.
    baseUrl: resolveAgentsAppSdkBaseUrl(),
    accessToken: resolveAppSdkAccessToken(currentSession),
    authToken: resolveAppSdkAuthToken(currentSession),
    platform: "mini-program",
  };
}

export function initDriveAppSdkClient(
  config: SdkworkAgentsMpDriveAppClientConfig = createDriveAppSdkClientConfig(),
): SdkworkAgentsMpDriveAppClient {
  driveAppSdkClient = createClient(config);
  return driveAppSdkClient;
}

export function getDriveAppSdkClient(): SdkworkAgentsMpDriveAppClient {
  return driveAppSdkClient ?? initDriveAppSdkClient();
}

export function resetDriveAppSdkClient(): void {
  driveAppSdkClient = null;
}
