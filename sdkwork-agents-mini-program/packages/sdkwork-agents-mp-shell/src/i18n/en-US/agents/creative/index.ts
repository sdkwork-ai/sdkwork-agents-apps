/**
 * Creative studio surface copy (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMpCreativeEnUs = {
  "agents.creative.title": "Create",
  "agents.creative.prompt.label": "Prompt",
  "agents.creative.prompt.placeholder": "Describe what you want to create",
  "agents.creative.modality.label": "Type",
  "agents.creative.modality.image": "Image",
  "agents.creative.modality.video": "Video",
  "agents.creative.modality.music": "Music",
  "agents.creative.aspect.label": "Aspect",
  "agents.creative.aspect.square": "1:1",
  "agents.creative.aspect.landscape": "3:2",
  "agents.creative.aspect.portrait": "2:3",
  "agents.creative.submit": "Generate",
  "agents.creative.submitting": "Generating",
  "agents.creative.promptRequired": "Enter a prompt first",
  "agents.creative.loading": "Loading generation capability",
  "agents.creative.loadFailed": "Generation capability failed to load. Try again",
  "agents.creative.unavailable": "The generation service is unavailable in this runtime",
  "agents.creative.noTools": "No generation type is available",
  "agents.creative.sessions.title": "Runs on this device",
  "agents.creative.sessions.empty": "No runs yet",
  "agents.creative.sessions.clear": "Clear runs",
  "agents.creative.sessions.cleared": "Runs cleared",
  "agents.creative.sessions.localNote": "Runs are stored on this device only",
  "agents.creative.results.title": "Results",
  "agents.creative.results.empty": "This run returned nothing to display",
  "agents.creative.submitFailed": "Generation failed. Try again",
  "agents.creative.pending": "Generation submitted; results appear in Assets",
  "agents.creative.status.succeeded": "Completed",
  "agents.creative.status.failed": "Failed",
  "agents.creative.status.pending": "In progress",
  "agents.creative.meta": "{{time}} · {{modality}}",
  "agents.creative.openFailed": "This result cannot be opened",
  "agents.creative.play": "Play",
  "agents.creative.pause": "Pause",
  "agents.creative.open": "Open",
} as const;

export type AgentsMpCreativeMessageKey = keyof typeof agentsMpCreativeEnUs;
