/**
 * Order app-service bootstrap for the Agents H5 root.
 *
 * Membership checkout is owned by `sdkwork-order`: this adapter configures the
 * shared order app service with the same session token manager the Agents SDK
 * uses, so the membership page can create a real cashier checkout. The
 * capability package still sees only its membership port.
 */

import {
  bootstrapSdkworkOrderAppService,
  createSdkworkMembershipCheckoutService,
  type SdkworkMembershipCheckoutPayment,
  type SdkworkMembershipCheckoutService,
} from "@sdkwork/order-service";

import {
  getSdkworkChatGlobalTokenManager,
  readAppSdkSessionTokens,
  resolveAppSdkAccessToken,
  resolveAppSdkAuthToken,
} from "../session/session";
import { resolveAgentsAppSdkBaseUrl } from "./agentsAppSdkClient";

let checkoutService: SdkworkMembershipCheckoutService | null = null;

/** Configures the order app service once per session/bootstrap. */
export function bootstrapAgentsOrderService(): SdkworkMembershipCheckoutService {
  if (checkoutService) {
    return checkoutService;
  }
  const session = readAppSdkSessionTokens();
  bootstrapSdkworkOrderAppService({
    baseUrl: resolveAgentsAppSdkBaseUrl(),
    accessToken: resolveAppSdkAccessToken(session),
    authToken: resolveAppSdkAuthToken(session),
    platform: "h5",
    tokenManager: getSdkworkChatGlobalTokenManager(),
  });
  checkoutService = createSdkworkMembershipCheckoutService();
  return checkoutService;
}

export function getAgentsMembershipCheckoutService(): SdkworkMembershipCheckoutService {
  return checkoutService ?? bootstrapAgentsOrderService();
}

export function resetAgentsOrderService(): void {
  checkoutService = null;
}

export type { SdkworkMembershipCheckoutPayment, SdkworkMembershipCheckoutService };
