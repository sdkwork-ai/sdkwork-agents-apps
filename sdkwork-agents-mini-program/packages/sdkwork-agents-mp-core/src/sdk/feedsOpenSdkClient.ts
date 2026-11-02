/**
 * Feeds open SDK client for the Agents mini program inspiration surface.
 *
 * Feed streams are anonymous public reads; this client carries no session token.
 * The feeds gateway serves `/feeds/v3/api` from the gateway root, so the Agents
 * app-api suffix is stripped from the configured base URL.
 */

import {
  createClient,
  type SdkworkCustomConfig,
  type SdkworkFeedsOpenClient,
} from "@sdkwork/feeds-sdk";

import { resolveAgentsAppSdkBaseUrl } from "./agentsAppSdkClient";

export type SdkworkAgentsMpFeedsOpenClient = SdkworkFeedsOpenClient;

let feedsOpenSdkClient: SdkworkAgentsMpFeedsOpenClient | null = null;

export function resolveFeedsOpenSdkBaseUrl(): string {
  return resolveAgentsAppSdkBaseUrl().replace(/\/app\/v3\/api\/?$/u, "");
}

export function createFeedsOpenSdkClientConfig(): SdkworkCustomConfig {
  return {
    baseUrl: resolveFeedsOpenSdkBaseUrl(),
    platform: "mini-program",
  };
}

export function initFeedsOpenSdkClient(
  config: SdkworkCustomConfig = createFeedsOpenSdkClientConfig(),
): SdkworkAgentsMpFeedsOpenClient {
  feedsOpenSdkClient = createClient(config);
  return feedsOpenSdkClient;
}

export function getFeedsOpenSdkClient(): SdkworkAgentsMpFeedsOpenClient {
  return feedsOpenSdkClient ?? initFeedsOpenSdkClient();
}

export function resetFeedsOpenSdkClient(): void {
  feedsOpenSdkClient = null;
}
