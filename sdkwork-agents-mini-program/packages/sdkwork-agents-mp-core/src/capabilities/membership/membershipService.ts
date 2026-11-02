import {
  type AgentsMpMembershipAvailability,
  type AgentsMpMembershipCatalog,
  type AgentsMpMembershipPlan,
  type AgentsMpMembershipSummary,
  type AgentsMpMembershipUnavailableReason,
} from "./membershipModels";

/**
 * Membership orchestration.
 *
 * The page asks this service for the catalog; the service owns whether this
 * runtime can answer at all. No plan list, price, or benefit is synthesized: an
 * absent transport yields `unavailable` and the page renders its localized
 * unavailable state with the actionable alternative (complete checkout on
 * desktop) and a retry action.
 */
export interface AgentsMpMembershipCatalogPort {
  loadCatalog(): Promise<{
    summary: AgentsMpMembershipSummary;
    plans: AgentsMpMembershipPlan[];
    pointsBalance?: number;
  }>;
  /** Starts checkout and resolves the cashier URL when the provider returns one. */
  startCheckout?(planId: string): Promise<string | undefined>;
}

export type AgentsMpMembershipCheckoutResult =
  | { readonly started: true; readonly cashierUrl?: string }
  | {
      readonly started: false;
      readonly reason: AgentsMpMembershipUnavailableReason;
    };

export interface AgentsMpMembershipService {
  readonly availability: AgentsMpMembershipAvailability;
  readonly checkoutAvailability: AgentsMpMembershipAvailability;
  readonly unavailableReason?: AgentsMpMembershipUnavailableReason;
  loadCatalog(): Promise<AgentsMpMembershipCatalog>;
  startCheckout(planId: string): Promise<AgentsMpMembershipCheckoutResult>;
}

const EMPTY_SUMMARY: AgentsMpMembershipSummary = { active: false };

export function createAgentsMpMembershipService(
  port?: AgentsMpMembershipCatalogPort,
): AgentsMpMembershipService {
  if (!port) {
    return {
      availability: "unavailable",
      checkoutAvailability: "unavailable",
      unavailableReason: "transport-not-composed",
      async loadCatalog() {
        return {
          availability: "unavailable",
          summary: EMPTY_SUMMARY,
          plans: [],
          reason: "transport-not-composed",
        };
      },
      async startCheckout() {
        return { started: false, reason: "transport-not-composed" };
      },
    };
  }

  return {
    availability: "available",
    checkoutAvailability: port.startCheckout ? "available" : "unavailable",
    async loadCatalog() {
      const catalog = await port.loadCatalog();
      return {
        availability: "available",
        summary: catalog.summary,
        plans: catalog.plans,
        ...(catalog.pointsBalance !== undefined
          ? { pointsBalance: catalog.pointsBalance }
          : {}),
      };
    },
    async startCheckout(planId) {
      if (!port.startCheckout) {
        return { started: false, reason: "checkout-not-composed" };
      }
      const cashierUrl = await port.startCheckout(planId);
      return {
        started: true,
        ...(cashierUrl ? { cashierUrl } : {}),
      };
    },
  };
}
