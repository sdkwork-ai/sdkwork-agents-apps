/** Maximum characters kept for a conversation title. */
const MAX_SESSION_TITLE_LENGTH = 60;

/** Collapses whitespace and clamps a session title. */
export function trimSessionTitle(title: string): string {
  const normalized = title.replace(/\s+/gu, " ").trim();
  if (normalized.length <= MAX_SESSION_TITLE_LENGTH) {
    return normalized;
  }
  return normalized.slice(0, MAX_SESSION_TITLE_LENGTH).trimEnd();
}
