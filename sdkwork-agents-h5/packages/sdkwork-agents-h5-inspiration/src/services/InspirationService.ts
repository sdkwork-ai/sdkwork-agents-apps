import type { InspirationChannel, InspirationItem } from "../types";
import { getInspirationPort, isInspirationPortConfigured } from "./inspirationPort";

export type InspirationFeed =
  | { readonly availability: "available"; readonly items: readonly InspirationItem[] }
  | { readonly availability: "unavailable"; readonly reason: "transport-not-composed" };

export class InspirationService {
  static async loadFeed(channel: InspirationChannel): Promise<InspirationFeed> {
    if (!isInspirationPortConfigured()) {
      return { availability: "unavailable", reason: "transport-not-composed" };
    }
    const items = await getInspirationPort().loadFeed(channel);
    return { availability: "available", items };
  }
}
