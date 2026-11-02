/**
 * Feeds open SDK client for the Agents H5 inspiration surface.
 *
 * Feed streams are anonymous public reads (`skipAuth` in the generated
 * operations); this client therefore carries no session token.
 */

import {
  createClient,
  type FeedItem,
  type SdkworkCustomConfig,
  type SdkworkFeedsOpenClient,
} from "@sdkwork/feeds-sdk";
import { readRuntimeEnv, resolveBaseUrl } from "@sdkwork/sdk-common";

export type SdkworkAgentsFeedsOpenClient = SdkworkFeedsOpenClient;

let feedsOpenSdkClient: SdkworkAgentsFeedsOpenClient | null = null;

const FEEDS_BASE_URL_KEY = "VITE_SDKWORK_AGENTS_H5_FEEDS_OPEN_API_BASE_URL";
const PLATFORM_GATEWAY_KEY = "VITE_SDKWORK_AGENTS_PLATFORM_API_GATEWAY_HTTP_URL";

export function resolveFeedsOpenSdkBaseUrl(): string {
  return (
    readRuntimeEnv(FEEDS_BASE_URL_KEY) ??
    readRuntimeEnv(PLATFORM_GATEWAY_KEY) ??
    resolveBaseUrl({ envKey: "SDKWORK_API_BASE_URL", preservePath: false }).url
  );
}

export function createFeedsOpenSdkClientConfig(): SdkworkCustomConfig {
  return {
    baseUrl: resolveFeedsOpenSdkBaseUrl(),
    platform: "h5",
  };
}

export function initFeedsOpenSdkClient(
  config: SdkworkCustomConfig = createFeedsOpenSdkClientConfig(),
): SdkworkAgentsFeedsOpenClient {
  feedsOpenSdkClient = createClient(config);
  return feedsOpenSdkClient;
}

export function getFeedsOpenSdkClient(): SdkworkAgentsFeedsOpenClient {
  return feedsOpenSdkClient ?? initFeedsOpenSdkClient();
}

export function resetFeedsOpenSdkClient(): void {
  feedsOpenSdkClient = null;
}

export type { FeedItem };
