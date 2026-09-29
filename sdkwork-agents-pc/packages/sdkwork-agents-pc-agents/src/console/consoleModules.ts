/**
 * Canonical module catalog of the user-console Agents surface.
 *
 * Ownership sits here, with the capability, for the same reason the Memory
 * console owns its own catalog: an embedding host mounts the block with this
 * list and inherits every current and future console module instead of
 * hardcoding routes. The host only maps `route` onto its own path prefix
 * (`/console/agents/<route>`).
 */
export const AGENTS_CONSOLE_MODULE_IDS = ['manage', 'editor'] as const;

export type AgentsConsoleModuleId = (typeof AGENTS_CONSOLE_MODULE_IDS)[number];

export interface AgentsConsoleModule {
  id: AgentsConsoleModuleId;
  /** Route segment the host appends to its console prefix. */
  route: string;
  /** i18n key, resolved by the host's `common` namespace (see `agentsConsoleI18nCatalogs`). */
  titleKey: string;
  /**
   * The module edits exactly one agent. When the host deep-links an existing
   * agent it appends the agent id to the route and the module renders the editor
   * for it; without an id the same module renders the creation flow, so create
   * and edit can never drift into two different forms.
   *
   * It also marks the module as a *flow* rather than a *section*: the embed keeps
   * it out of the module switcher and renders no switcher while it is active, so
   * a host can mount it on its own full-bleed route with the form as the page.
   */
  editsAgent?: boolean;
}

/**
 * Ordering is the user journey: see and manage what you have, then create or
 * reconfigure one agent.
 */
export const agentsConsoleModules: readonly AgentsConsoleModule[] = assertUniqueConsoleModules([
  { id: 'manage', route: 'mine', titleKey: 'agentsConsoleModuleManage' },
  { id: 'editor', route: 'editor', titleKey: 'agentsConsoleModuleEditor', editsAgent: true },
]);

/** Default module when the host URL carries no module segment. */
export const DEFAULT_AGENTS_CONSOLE_MODULE_ID: AgentsConsoleModuleId = agentsConsoleModules[0].id;

/** Resolves a module by id, so a host can validate a deep link before rendering. */
export function findAgentsConsoleModuleById(
  id: string | undefined,
): AgentsConsoleModule | undefined {
  if (!id) return undefined;
  return agentsConsoleModules.find((candidate) => candidate.id === id);
}

/** Resolves a module by its route segment (`/console/agents/<route>`). */
export function findAgentsConsoleModuleByRoute(
  route: string | undefined,
): AgentsConsoleModule | undefined {
  if (!route) return undefined;
  return agentsConsoleModules.find((candidate) => candidate.route === route);
}

/**
 * Fails fast on a duplicate id or a duplicate route: the first would render two
 * switcher entries that select the same page, the second would make deep links
 * ambiguous.
 */
function assertUniqueConsoleModules(
  modules: readonly AgentsConsoleModule[],
): readonly AgentsConsoleModule[] {
  const ids = new Set<string>();
  const routes = new Set<string>();
  for (const module of modules) {
    if (ids.has(module.id)) throw new Error(`Duplicate Agents console module id: ${module.id}`);
    if (routes.has(module.route)) throw new Error(`Duplicate Agents console module route: ${module.route}`);
    ids.add(module.id);
    routes.add(module.route);
  }
  return modules;
}
