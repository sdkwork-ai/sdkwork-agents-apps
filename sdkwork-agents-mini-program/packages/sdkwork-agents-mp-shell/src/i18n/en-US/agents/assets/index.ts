/**
 * Asset library surface copy (en-US).
 *
 * Fragment path follows `I18N_SPEC.md` section 6.1:
 * `<locale>/<domain>/<capability>/<fragment>`.
 */
export const agentsMpAssetsEnUs = {
  "agents.assets.title": "Assets",
  "agents.assets.filter.all": "All",
  "agents.assets.filter.image": "Images",
  "agents.assets.filter.video": "Videos",
  "agents.assets.filter.audio": "Audio",
  "agents.assets.filter.other": "Other",
  "agents.assets.loading": "Loading assets",
  "agents.assets.empty": "No generated assets yet",
  "agents.assets.emptyFiltered": "No asset matches this filter",
  "agents.assets.loadFailed": "Assets failed to load. Try again",
  "agents.assets.count": "{{count}} items",
  "agents.assets.detail.title": "Asset detail",
  "agents.assets.detail.kind": "Type",
  "agents.assets.detail.createdAt": "Created",
  "agents.assets.detail.source": "Source tool",
  "agents.assets.detail.openFailed": "This asset cannot be opened",
  "agents.assets.detail.play": "Play",
  "agents.assets.detail.pause": "Pause",
  "agents.assets.detail.open": "Open file",
  "agents.assets.detail.emptyPreview": "This asset has no preview address",
  "agents.assets.kind.image": "Image",
  "agents.assets.kind.video": "Video",
  "agents.assets.kind.audio": "Audio",
  "agents.assets.kind.other": "File",
} as const;

export type AgentsMpAssetsMessageKey = keyof typeof agentsMpAssetsEnUs;
