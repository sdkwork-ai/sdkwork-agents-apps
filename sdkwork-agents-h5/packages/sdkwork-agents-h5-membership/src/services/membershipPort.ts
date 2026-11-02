import type { MembershipCatalog } from "../types";

/**
 * Transport port for the membership catalog and checkout.
 *
 * A root that has not composed the membership/order transport leaves the port
 * unset; the service then reports `unavailable` and the page renders the
 * localized alternative instead of an invented price.
 */
export interface MembershipPort {
  loadCatalog(): Promise<MembershipCatalog>;
  /** Checkout is optional: a root may expose a real catalog without payment. */
  startCheckout?(planId: string): Promise<void>;
}

let membershipPort: MembershipPort | null = null;

export function configureMembershipPort(port: MembershipPort | null): void {
  membershipPort = port;
}

export function getMembershipPort(): MembershipPort {
  if (!membershipPort) {
    throw new Error("Membership transport is not composed for this client root.");
  }
  return membershipPort;
}

export function getMembershipPortIfConfigured(): MembershipPort | null {
  return membershipPort;
}

export function isMembershipPortConfigured(): boolean {
  return membershipPort !== null;
}

export function resetMembershipPort(): void {
  membershipPort = null;
}
