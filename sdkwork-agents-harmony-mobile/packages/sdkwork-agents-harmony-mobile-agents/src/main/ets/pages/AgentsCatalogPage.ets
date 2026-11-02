/**
 * Compatibility re-export.
 *
 * The contract page path for `app.agents.catalog.list` is
 * `pages/agents/AgentsList` (`specs/client-page-parity.spec.json`), so the
 * screen implementation lives there. This module keeps the historical
 * `AgentsCatalogPage` export name importable by existing composition code.
 */
export { AgentsListPage, AgentsListPage as AgentsCatalogPage } from './agents/AgentsList';
