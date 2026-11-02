import type { ProfileAccount, ProfileMembership, ProfileUsage } from "../types";

/**
 * Transport port for the account and membership summary shown on the hub.
 *
 * The application root binds the IAM session and (when composed) the membership
 * service. A root without a membership transport reports `null`, and the hub
 * renders the localized unavailable hint for that row only.
 */
export interface ProfilePort {
  loadAccount(): ProfileAccount;
  loadMembership(): Promise<ProfileMembership | null>;
  loadUsage(): Promise<ProfileUsage | null>;
}

let profilePort: ProfilePort | null = null;

export function configureProfilePort(port: ProfilePort | null): void {
  profilePort = port;
}

export function getProfilePort(): ProfilePort | null {
  return profilePort;
}

export function resetProfilePort(): void {
  profilePort = null;
}
