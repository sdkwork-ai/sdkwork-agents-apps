/**
 * Order app-service bootstrap for the Agents mini program.
 *
 * Membership checkout is created by `sdkwork-order`; the returned cashier URL
 * is opened in the platform web-view page so WeChat H5 payment can complete.
 */

import {
  bootstrapSdkworkOrderAppService,
  createSdkworkMembershipCheckoutService,
  type SdkworkMembershipCheckoutPayment,
  type SdkworkMembershipCheckoutService,
} from "@sdkwork/order-service";

import {
  readAppSdkSessionTokens,
  resolveAppSdkAccessToken,
  resolveAppSdkAuthToken,
} from "../session/session";
import { resolveAgentsAppSdkBaseUrl } from "./agentsAppSdkClient";

let checkoutService: SdkworkMembershipCheckoutService | null = null;

export function bootstrapAgentsMpOrderService(): SdkworkMembershipCheckoutService {
  if (checkoutService) {
    return checkoutService;
  }
  const session = readAppSdkSessionTokens();
  bootstrapSdkworkOrderAppService({
    baseUrl: resolveAgentsAppSdkBaseUrl(),
    accessToken: resolveAppSdkAccessToken(session),
    authToken: resolveAppSdkAuthToken(session),
    platform: "mini-program",
  });
  checkoutService = createSdkworkMembershipCheckoutService();
  return checkoutService;
}

export function getAgentsMpMembershipCheckoutService(): SdkworkMembershipCheckoutService {
  return checkoutService ?? bootstrapAgentsMpOrderService();
}

export function resetAgentsMpOrderService(): void {
  checkoutService = null;
}

export type { SdkworkMembershipCheckoutPayment, SdkworkMembershipCheckoutService };
