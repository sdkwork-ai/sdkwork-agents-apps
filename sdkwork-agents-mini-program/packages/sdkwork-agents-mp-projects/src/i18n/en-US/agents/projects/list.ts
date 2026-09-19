/**
 * Projects surface copy (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. Keys mirror the PC and H5 roots so
 * every client speaks one vocabulary.
 */
export const agentsMpProjectsListEnUs = {
  "agents.projects.title": "Projects",
  "agents.projects.search.placeholder": "Search projects",
  "agents.projects.empty": "No projects yet",
  "agents.projects.loading": "Loading",
  "agents.projects.loadFailed": "Failed to load projects. Please retry.",
  "agents.projects.truncated": "Many projects: showing the most recent entries",
  "agents.projects.sessionCount": "{{count}} sessions",
} as const;
