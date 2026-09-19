/**
 * Library surface copy (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. Keys mirror the PC and H5 roots so
 * every client speaks one vocabulary.
 */
export const agentsMpLibraryListEnUs = {
  "agents.library.title": "Library",
  "agents.library.search.placeholder": "Search the library",
  "agents.library.empty": "Nothing in the library yet",
  "agents.library.loading": "Loading",
  "agents.library.loadFailed": "Failed to load the library. Please retry.",
  "agents.library.truncated": "Many entries: showing the most recent ones",
  "agents.library.openFailed": "Unable to open this file",
} as const;
