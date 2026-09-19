import { getAutomationPort } from "./automationPort";
import type { AutomationTaskSummary } from "../types";

export const AUTOMATION_PAGE_SIZE = 20;
export const AUTOMATION_MAX_PAGES = 5;

export interface AutomationListing {
  items: AutomationTaskSummary[];
  truncated: boolean;
}

export class AutomationService {
  /** Drains the page listing up to the page cap. */
  static async listTasks(): Promise<AutomationListing> {
    const port = getAutomationPort();
    const collected: AutomationTaskSummary[] = [];
    for (let page = 1; page <= AUTOMATION_MAX_PAGES; page += 1) {
      const result = await port.listTasks(page, AUTOMATION_PAGE_SIZE);
      collected.push(...result.items);
      if (!result.hasMore) {
        return { items: collected, truncated: false };
      }
    }
    return { items: collected, truncated: true };
  }

  static filterByName(items: AutomationTaskSummary[], query: string): AutomationTaskSummary[] {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return items;
    }
    return items.filter((item) => item.name.toLowerCase().includes(needle));
  }
}
