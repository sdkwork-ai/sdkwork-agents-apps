import { AGENTS_HARMONY_MOBILE_TABS, resolveAgentsHarmonyTabRouteId } from '../navigation/RouteStack';

/**
 * Shell tab state that must survive background/foreground.
 *
 * Authority: `APP_HARMONY_NATIVE_UI_SPEC.md` section 5 (lifecycle-aware state)
 * and `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 5 (package-local state).
 *
 * Two layers keep the selected tab:
 *
 * 1. `@State` in the tab container — each `TabContent` subtree stays mounted, so a
 *    tab's scroll position, draft input, and loaded page state stay alive while
 *    the ability goes to background and returns.
 * 2. `PersistentStorage` — writes the selected tab index to disk so an ability
 *    destroyed in the background (memory pressure) reopens on the same tab.
 */

const ACTIVE_TAB_INDEX_KEY: string = 'agents.harmony.shell.activeTabIndex';

function normalizeTabIndex(stored: number | undefined): number {
  if (stored === undefined || stored < 0 || stored >= AGENTS_HARMONY_MOBILE_TABS.length) {
    return 0;
  }
  return stored;
}

/**
 * Restores the persisted tab index.
 *
 * Must run in a UI context (page construction / `aboutToAppear`) because
 * `PersistentStorage` binds application storage to the UI instance.
 */
export function restoreAgentsHarmonyActiveTabIndex(): number {
  PersistentStorage.persistProp(ACTIVE_TAB_INDEX_KEY, 0);
  return normalizeTabIndex(AppStorage.get(ACTIVE_TAB_INDEX_KEY));
}

/** Reads the currently stored tab index without touching persistence binding. */
export function readAgentsHarmonyActiveTabIndex(): number {
  return normalizeTabIndex(AppStorage.get(ACTIVE_TAB_INDEX_KEY));
}

/** Persists the selected tab index; safe to call on every tab change. */
export function persistAgentsHarmonyActiveTabIndex(index: number): void {
  if (index < 0 || index >= AGENTS_HARMONY_MOBILE_TABS.length) {
    return;
  }
  AppStorage.setOrCreate(ACTIVE_TAB_INDEX_KEY, index);
}

/**
 * Re-affirms the persisted tab state when the ability moves to the background.
 *
 * `PersistentStorage` flushes on change; re-writing on `onBackground` covers a
 * change made during the same background transition.
 */
export function preserveAgentsHarmonyShellState(): void {
  persistAgentsHarmonyActiveTabIndex(readAgentsHarmonyActiveTabIndex());
}

/** Route id of the tab that should be visible after a restore. */
export function restoredAgentsHarmonyTabRouteId(): string {
  return resolveAgentsHarmonyTabRouteId(readAgentsHarmonyActiveTabIndex());
}
