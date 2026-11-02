import type { ProfileAccount, ProfileMembership, ProfileUsage } from "../types";
import { getProfilePort } from "./profilePort";

const SIGNED_OUT: ProfileAccount = { signedIn: false };

export class ProfileService {
  static loadAccount(): ProfileAccount {
    return getProfilePort()?.loadAccount() ?? SIGNED_OUT;
  }

  static async loadMembership(): Promise<ProfileMembership | null> {
    const port = getProfilePort();
    if (!port) {
      return null;
    }
    return port.loadMembership();
  }

  static async loadUsage(): Promise<ProfileUsage | null> {
    const port = getProfilePort();
    if (!port) {
      return null;
    }
    return port.loadUsage();
  }
}
