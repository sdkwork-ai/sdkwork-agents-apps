import type {
  MembershipCatalog,
  MembershipPlan,
  MembershipPointsRecord,
  MembershipSummary,
} from "../types";
import {
  getMembershipPort,
  getMembershipPortIfConfigured,
  isMembershipPortConfigured,
} from "./membershipPort";

const EMPTY_SUMMARY: MembershipSummary = { active: false };

export type MembershipCatalogResult =
  | {
      readonly availability: "available";
      readonly summary: MembershipSummary;
      readonly plans: readonly MembershipPlan[];
      readonly pointsBalance?: number;
      readonly pointsHistory?: readonly MembershipPointsRecord[];
    }
  | {
      readonly availability: "unavailable";
      readonly summary: MembershipSummary;
      readonly plans: readonly MembershipPlan[];
      readonly pointsBalance?: number;
      readonly pointsHistory?: readonly MembershipPointsRecord[];
      readonly reason: "transport-not-composed";
    };

export type MembershipCheckoutResult =
  | { readonly started: true }
  | {
      readonly started: false;
      readonly reason: "transport-not-composed" | "checkout-not-composed";
    };

export class MembershipService {
  static isAvailable(): boolean {
    return isMembershipPortConfigured();
  }

  static isCheckoutAvailable(): boolean {
    return Boolean(getMembershipPortIfConfigured()?.startCheckout);
  }

  static async loadCatalog(): Promise<MembershipCatalogResult> {
    if (!isMembershipPortConfigured()) {
      return {
        availability: "unavailable",
        summary: EMPTY_SUMMARY,
        plans: [],
        reason: "transport-not-composed",
      };
    }
    const catalog: MembershipCatalog = await getMembershipPort().loadCatalog();
    return {
      availability: "available",
      summary: catalog.summary,
      plans: catalog.plans,
      ...(catalog.pointsBalance !== undefined
        ? { pointsBalance: catalog.pointsBalance }
        : {}),
      ...(catalog.pointsHistory ? { pointsHistory: catalog.pointsHistory } : {}),
    };
  }

  static async startCheckout(planId: string): Promise<MembershipCheckoutResult> {
    if (!isMembershipPortConfigured()) {
      return { started: false, reason: "transport-not-composed" };
    }
    const port = getMembershipPort();
    if (!port.startCheckout) {
      return { started: false, reason: "checkout-not-composed" };
    }
    await port.startCheckout(planId);
    return { started: true };
  }
}
