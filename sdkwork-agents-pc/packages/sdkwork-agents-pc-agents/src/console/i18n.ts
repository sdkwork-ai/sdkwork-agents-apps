//! i18n catalogs for the Agents user-console entry.
//!
//! The `agentsConsole*` keys live in the agents common catalog (namespace
//! `common`), so a host that already registers `agentsWorkbenchI18nCatalogs` —
//! the Cloud Router portal does, for the embedded workbench — needs no extra
//! registration step. This subpath exists for hosts that embed only the console.
export {
  agentsWorkbenchCommonCatalog as agentsConsoleCatalog,
  agentsWorkbenchI18nCatalogs as agentsConsoleI18nCatalogs,
} from '@sdkwork/agents-pc-commons/i18n';
