/**
 * Projects port.
 *
 * The transport lives behind an injected port so this package never constructs a
 * generated SDK client (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` section 8).
 */

import type { AgentProjectPage } from "../types";

export interface ProjectsPort {
  listProjects(page: number, pageSize: number): Promise<AgentProjectPage>;
}

let projectsPort: ProjectsPort | null = null;

export function configureProjectsPort(port: ProjectsPort): void {
  projectsPort = port;
}

export function getProjectsPort(): ProjectsPort {
  if (!projectsPort) {
    throw new Error("Projects port is not configured.");
  }
  return projectsPort;
}

export function isProjectsPortConfigured(): boolean {
  return projectsPort !== null;
}

/** Test-only reset so isolated unit tests can re-wire the port. */
export function resetProjectsPort(): void {
  projectsPort = null;
}
