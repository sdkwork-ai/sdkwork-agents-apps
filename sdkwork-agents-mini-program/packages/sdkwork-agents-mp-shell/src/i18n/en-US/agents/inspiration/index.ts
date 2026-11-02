/**
 * Inspiration surface copy (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`. Keys mirror the PC inspiration
 * surface so every client speaks one vocabulary. Unavailable copy states the
 * current runtime fact instead of promising a later release.
 */
export const agentsMpInspirationEnUs = {
  "agents.inspiration.title": "Inspiration",
  "agents.inspiration.segment.discover": "Discover",
  "agents.inspiration.segment.featured": "Featured",
  "agents.inspiration.loading": "Loading inspiration",
  "agents.inspiration.empty": "No inspiration content here yet",
  "agents.inspiration.loadFailed": "Inspiration failed to load. Try again",
  "agents.inspiration.unavailable": "The inspiration service is unavailable in this runtime",
  "agents.inspiration.count": "{{count}} items",
  "agents.inspiration.likes": "{{count}} likes",
  "agents.inspiration.promptLabel": "Prompt",
  "agents.inspiration.pullHint": "Pull to refresh",
} as const;

export type AgentsMpInspirationMessageKey = keyof typeof agentsMpInspirationEnUs;
