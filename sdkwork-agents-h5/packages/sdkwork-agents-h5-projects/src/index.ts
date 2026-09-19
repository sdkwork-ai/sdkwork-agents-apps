/**
 * Public integration surface of the Agents H5 projects capability.
 */

export { ProjectsScreen } from "./screens/ProjectsScreen";
export type { ProjectsScreenProps } from "./screens/ProjectsScreen";

export {
  PROJECTS_MAX_PAGES,
  PROJECTS_PAGE_SIZE,
  ProjectsService,
} from "./services/ProjectsService";
export type { ProjectsListing } from "./services/ProjectsService";

export {
  configureProjectsPort,
  getProjectsPort,
  isProjectsPortConfigured,
  resetProjectsPort,
} from "./services/projectsPort";
export type { ProjectsPort } from "./services/projectsPort";

export { projectsRouteContributions } from "./routes/projectsRouteContributions";

export {
  AGENTS_PROJECTS_MESSAGES,
  DEFAULT_AGENTS_PROJECTS_LOCALE,
  configureAgentsProjectsLocale,
  getAgentsProjectsLocale,
  normalizeAgentsProjectsLocale,
  translateAgentsProjectsText,
} from "./i18n";
export type { AgentsProjectsLocale, AgentsProjectsMessageKey } from "./i18n";

export type { AgentProjectPage, AgentProjectSummary } from "./types";
