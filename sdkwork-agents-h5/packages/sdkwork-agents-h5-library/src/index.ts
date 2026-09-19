/**
 * Public integration surface of the Agents H5 library capability.
 */

export { LibraryScreen } from "./screens/LibraryScreen";
export type { LibraryScreenProps } from "./screens/LibraryScreen";

export { LibraryService } from "./services/LibraryService";
export type { LibraryListing } from "./services/LibraryService";

export {
  configureLibraryPort,
  getLibraryPort,
  isLibraryPortConfigured,
  resetLibraryPort,
} from "./services/libraryPort";
export type { LibraryPort } from "./services/libraryPort";

export {
  LIBRARY_MAX_PAGES,
  LIBRARY_PAGE_SIZE,
  LIBRARY_SEARCH_DEBOUNCE_MS,
} from "./libraryConstants";

export { libraryRouteContributions } from "./routes/libraryRouteContributions";

export {
  AGENTS_LIBRARY_MESSAGES,
  DEFAULT_AGENTS_LIBRARY_LOCALE,
  configureAgentsLibraryLocale,
  getAgentsLibraryLocale,
  normalizeAgentsLibraryLocale,
  translateAgentsLibraryText,
} from "./i18n";
export type { AgentsLibraryLocale, AgentsLibraryMessageKey } from "./i18n";

export type { LibraryFile, LibraryPage } from "./types";
