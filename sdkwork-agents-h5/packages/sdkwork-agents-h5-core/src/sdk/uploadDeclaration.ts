/**
 * Application upload declaration constants.
 *
 * Authority: `DRIVE_SPEC.md` section 18 (Application Upload Declaration Contract).
 * Declared values live in `apps/sdkwork-agents-h5/specs/upload.declaration.json`; this module
 * carries them into code so upload call sites reference a constant instead of repeating
 * literals. Call sites MUST NOT inline these values, and the declaration MUST NOT be
 * duplicated as a second local authority.
 */

export interface AgentsH5UploadDeclarationEntry {
  readonly appResourceIdKind: "application" | "entity" | "draft";
  readonly appResourceType: string;
  readonly purpose: string;
  readonly retention: "long_term" | "temporary";
  readonly scene: string;
  readonly source: string;
  readonly uploadProfileCode: string;
}

/** This application's canonical appId, from `sdkwork.app.config.json` `backend.appId`. */
export const AGENTS_H5_APP_ID = "sdkwork-agents" as const;

/** The single call-origin label for every upload from this application. */
export const AGENTS_H5_UPLOAD_SOURCE = "sdkwork-agents-h5" as const;

const AGENTS_H5_APP_RESOURCE_ID_KIND = "entity" as const;
const AGENTS_H5_RETENTION = "long_term" as const;

export const AGENTS_H5_AVATAR_UPLOAD = {
  appResourceIdKind: AGENTS_H5_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.avatar",
  purpose:
    "Agent profile avatar image uploaded from the mobile agent settings surface so the agent can be rendered with a stable portrait.",
  retention: AGENTS_H5_RETENTION,
  scene: "agent-profile",
  source: AGENTS_H5_UPLOAD_SOURCE,
  uploadProfileCode: "avatar",
} as const satisfies AgentsH5UploadDeclarationEntry;

export const AGENTS_H5_SESSION_ATTACHMENT_UPLOAD = {
  appResourceIdKind: AGENTS_H5_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.session_attachment",
  purpose:
    "Generic file attached to an agent chat session from the mobile chat surface and indexed into the agent chat file library.",
  retention: AGENTS_H5_RETENTION,
  scene: "agent-chat",
  source: AGENTS_H5_UPLOAD_SOURCE,
  uploadProfileCode: "attachment",
} as const satisfies AgentsH5UploadDeclarationEntry;

export const AGENTS_H5_SESSION_IMAGE_UPLOAD = {
  appResourceIdKind: AGENTS_H5_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.session_image",
  purpose:
    "Image attached to an agent chat session from the mobile chat surface and indexed into the agent chat file library.",
  retention: AGENTS_H5_RETENTION,
  scene: "agent-chat",
  source: AGENTS_H5_UPLOAD_SOURCE,
  uploadProfileCode: "image",
} as const satisfies AgentsH5UploadDeclarationEntry;

export const AGENTS_H5_SESSION_VIDEO_UPLOAD = {
  appResourceIdKind: AGENTS_H5_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.session_video",
  purpose:
    "Video attached to an agent chat session from the mobile chat surface and indexed into the agent chat file library.",
  retention: AGENTS_H5_RETENTION,
  scene: "agent-chat",
  source: AGENTS_H5_UPLOAD_SOURCE,
  uploadProfileCode: "video",
} as const satisfies AgentsH5UploadDeclarationEntry;

export const AGENTS_H5_SESSION_VOICE_UPLOAD = {
  appResourceIdKind: AGENTS_H5_APP_RESOURCE_ID_KIND,
  appResourceType: "agent.session_voice",
  purpose:
    "Voice recording attached to an agent chat session from the mobile chat surface and indexed into the agent chat file library.",
  retention: AGENTS_H5_RETENTION,
  scene: "agent-chat",
  source: AGENTS_H5_UPLOAD_SOURCE,
  uploadProfileCode: "audio",
} as const satisfies AgentsH5UploadDeclarationEntry;

/** Every declared upload purpose for this application. */
export const AGENTS_H5_UPLOAD_DECLARATIONS: readonly AgentsH5UploadDeclarationEntry[] = [
  AGENTS_H5_AVATAR_UPLOAD,
  AGENTS_H5_SESSION_ATTACHMENT_UPLOAD,
  AGENTS_H5_SESSION_IMAGE_UPLOAD,
  AGENTS_H5_SESSION_VIDEO_UPLOAD,
  AGENTS_H5_SESSION_VOICE_UPLOAD,
];

/**
 * Map a chat attachment kind to the declared upload entry that carries its profile.
 *
 * The profile is chosen by content shape (`DRIVE_SPEC.md` section 18.2), so the kind-to-entry
 * mapping is the only lookup a call site needs.
 */
export function resolveAgentsH5ChatMediaUpload(
  kind: "file" | "image" | "video" | "voice",
): AgentsH5UploadDeclarationEntry {
  switch (kind) {
    case "image":
      return AGENTS_H5_SESSION_IMAGE_UPLOAD;
    case "video":
      return AGENTS_H5_SESSION_VIDEO_UPLOAD;
    case "voice":
      return AGENTS_H5_SESSION_VOICE_UPLOAD;
    default:
      return AGENTS_H5_SESSION_ATTACHMENT_UPLOAD;
  }
}
