import { getProjectsPort } from "./projectsPort";
import type { AgentProjectSummary } from "../types";

export const PROJECTS_PAGE_SIZE = 20;
export const PROJECTS_MAX_PAGES = 5;

export interface ProjectsListing {
  items: AgentProjectSummary[];
  truncated: boolean;
}

export class ProjectsService {
  /** Drains the page listing up to the page cap. */
  static async listProjects(): Promise<ProjectsListing> {
    const port = getProjectsPort();
    const collected: AgentProjectSummary[] = [];
    for (let page = 1; page <= PROJECTS_MAX_PAGES; page += 1) {
      const result = await port.listProjects(page, PROJECTS_PAGE_SIZE);
      collected.push(...result.items);
      if (!result.hasMore) {
        return { items: collected, truncated: false };
      }
    }
    return { items: collected, truncated: true };
  }

  static filterByName(items: AgentProjectSummary[], query: string): AgentProjectSummary[] {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return items;
    }
    return items.filter((item) => item.name.toLowerCase().includes(needle));
  }
}
