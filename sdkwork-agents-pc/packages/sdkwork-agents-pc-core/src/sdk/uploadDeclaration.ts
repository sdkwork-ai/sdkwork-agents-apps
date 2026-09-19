/**
 * Application upload declaration constants.
 *
 * Authority: `DRIVE_SPEC.md` section 18 (Application Upload Declaration Contract).
 * Declared values live in `apps/sdkwork-agents-pc/specs/upload.declaration.json`; this module
 * carries them into code so upload call sites reference a constant instead of repeating
 * literals. Call sites MUST NOT inline these values, and the declaration MUST NOT be
 * duplicated as a second local authority.
 *
 * The previous local values (`agent-avatar`, `agent-session-image`, `agents-pc`, ...) were not
 * rule-conforming: `appResourceType` must be a dotted `<domain>.<resource>` business type and
 * `source` must be a stable kebab-case call-origin label. They are converged here to the
 * declared values.
 */

export interface AgentsUploadDeclarationEntry {
  readonly appResourceIdKind: "application" | "entity" | "draft";
  readonly appResourceType: string;
  readonly purpose: string;
  readonly retention: "long_term" | "temporary";
  readonly scene: string;
  readonly source: string;
  readonly uploadProfileCode: string;
}

/** This application's canonical appId, from `sdkwork.app.config.json` `backend.appId`. */
export const AGENTS_APP_ID = "sdkwork-agents" as const;

/** The single call-origin label for every upload from this application. */
export const AGENTS_UPLOAD_SOURCE = "sdkwork-agents-pc" as const;

const AGENTS_APP_RESOURCE_ID_KIND = "entity" as const;
const AGENTS_RETENTION = "long_term" as const;

export const AGENTS_AVATAR_UPLOAD = {
  appResourceIdKind: AGENTS_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.avatar",
  purpose:
    "Agent profile avatar image uploaded from the agent settings surface so the agent can be rendered with a stable portrait.",
  retention: AGENTS_RETENTION,
  scene: "agent-profile",
  source: AGENTS_UPLOAD_SOURCE,
  uploadProfileCode: "avatar",
} as const satisfies AgentsUploadDeclarationEntry;

export const AGENTS_SESSION_ATTACHMENT_UPLOAD = {
  appResourceIdKind: AGENTS_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.session_attachment",
  purpose:
    "Generic file attached to an agent chat session and indexed into the agent chat file library.",
  retention: AGENTS_RETENTION,
  scene: "agent-chat",
  source: AGENTS_UPLOAD_SOURCE,
  uploadProfileCode: "attachment",
} as const satisfies AgentsUploadDeclarationEntry;

export const AGENTS_SESSION_IMAGE_UPLOAD = {
  appResourceIdKind: AGENTS_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.session_image",
  purpose: "Image attached to an agent chat session and indexed into the agent chat file library.",
  retention: AGENTS_RETENTION,
  scene: "agent-chat",
  source: AGENTS_UPLOAD_SOURCE,
  uploadProfileCode: "image",
} as const satisfies AgentsUploadDeclarationEntry;

export const AGENTS_SESSION_VIDEO_UPLOAD = {
  appResourceIdKind: AGENTS_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.session_video",
  purpose: "Video attached to an agent chat session and indexed into the agent chat file library.",
  retention: AGENTS_RETENTION,
  scene: "agent-chat",
  source: AGENTS_UPLOAD_SOURCE,
  uploadProfileCode: "video",
} as const satisfies AgentsUploadDeclarationEntry;

export const AGENTS_SESSION_VOICE_UPLOAD = {
  appResourceIdKind: AGENTS_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.session_voice",
  purpose:
    "Voice recording attached to an agent chat session and indexed into the agent chat file library.",
  retention: AGENTS_RETENTION,
  scene: "agent-chat",
  source: AGENTS_UPLOAD_SOURCE,
  uploadProfileCode: "audio",
} as const satisfies AgentsUploadDeclarationEntry;

export const AGENTS_CREATIVE_IMAGE_UPLOAD = {
  appResourceIdKind: AGENTS_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.creative_image",
  purpose: "Reference or generated image uploaded into the agent creative workspace.",
  retention: AGENTS_RETENTION,
  scene: "agent-creative",
  source: AGENTS_UPLOAD_SOURCE,
  uploadProfileCode: "image",
} as const satisfies AgentsUploadDeclarationEntry;

export const AGENTS_CREATIVE_AUDIO_UPLOAD = {
  appResourceIdKind: AGENTS_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.creative_audio",
  purpose: "Reference or generated audio uploaded into the agent creative workspace.",
  retention: AGENTS_RETENTION,
  scene: "agent-creative",
  source: AGENTS_UPLOAD_SOURCE,
  uploadProfileCode: "audio",
} as const satisfies AgentsUploadDeclarationEntry;

export const AGENTS_CREATIVE_VIDEO_UPLOAD = {
  appResourceIdKind: AGENTS_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.creative_video",
  purpose: "Reference or generated video uploaded into the agent creative workspace.",
  retention: AGENTS_RETENTION,
  scene: "agent-creative",
  source: AGENTS_UPLOAD_SOURCE,
  uploadProfileCode: "video",
} as const satisfies AgentsUploadDeclarationEntry;

/** Every declared upload purpose for this application. */
export const AGENTS_UPLOAD_DECLARATIONS: readonly AgentsUploadDeclarationEntry[] = [
  AGENTS_AVATAR_UPLOAD,
  AGENTS_SESSION_ATTACHMENT_UPLOAD,
  AGENTS_SESSION_IMAGE_UPLOAD,
  AGENTS_SESSION_VIDEO_UPLOAD,
  AGENTS_SESSION_VOICE_UPLOAD,
  AGENTS_CREATIVE_IMAGE_UPLOAD,
  AGENTS_CREATIVE_AUDIO_UPLOAD,
  AGENTS_CREATIVE_VIDEO_UPLOAD,
];
