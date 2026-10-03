import type {
  DriveUploaderProfile,
  DriveUploaderProgress,
} from "@sdkwork/drive-app-sdk";
import {
  createDriveNodesImagePreviewReader,
  createDriveUploadImageService,
  type DriveUploadImageService,
} from "@sdkwork/drive-upload-image-core";
import { uuid } from "@sdkwork/utils";

import {
  getDriveAppSdkClientWithSession,
  type SdkworkAgentsDriveAppClient,
} from "./driveAppSdkClient";
import {
  AGENTS_AVATAR_UPLOAD,
  AGENTS_CREATIVE_AUDIO_UPLOAD,
  AGENTS_CREATIVE_IMAGE_UPLOAD,
  AGENTS_CREATIVE_VIDEO_UPLOAD,
  AGENTS_SESSION_ATTACHMENT_UPLOAD,
  AGENTS_SESSION_IMAGE_UPLOAD,
  AGENTS_SESSION_VIDEO_UPLOAD,
  AGENTS_SESSION_VOICE_UPLOAD,
  AGENTS_UPLOAD_SOURCE,
} from "./uploadDeclaration";

export type AgentsMediaKind = "image" | "video" | "audio" | "voice" | "document" | "archive" | "other";

/**
 * Drive node property that marks a chat-uploaded file as a member of the chat
 * file library. Written with `app_public` visibility so the file library can
 * list marked files through the Drive `propertyNodes.list` app API.
 */
export const CHAT_FILE_LIBRARY_PROPERTY_KEY = "agents.chat_file_library";
const CHAT_FILE_LIBRARY_PROPERTY_VALUE = "1";
const CHAT_FILE_LIBRARY_PROPERTY_VISIBILITY = "app_public";

/**
 * Standalone media-resource shape carried by upload results.
 *
 * The Drive app API publishes no `MediaResource` model, so the interface is
 * declared here instead of extending a nonexistent SDK export.
 */
export interface AgentsDriveMediaResource {
  id: string;
  kind: AgentsMediaKind;
  source: "drive";
  uri: string;
  url?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: string;
  metadata: {
    driveSpaceId?: string;
    driveNodeId?: string;
    uploadItemId?: string;
    drive?: {
      spaceId: string;
      nodeId: string;
      spaceType?: string;
      nodeVersion?: string;
    };
  };
}

export type AgentsDriveUploadPurpose =
  | "agent-avatar"
  | "agent-chat-attachment"
  | "agent-chat-image"
  | "agent-chat-video"
  | "agent-chat-voice"
  | "agent-creative-image"
  | "agent-creative-audio"
  | "agent-creative-video";

export interface AgentsDriveUploadRequest {
  file: File;
  purpose: AgentsDriveUploadPurpose;
  resourceId: string;
  signal?: AbortSignal;
  onProgress?: (progress: DriveUploaderProgress) => void;
}

interface UploadPolicy {
  appResourceType: string;
  kind: AgentsMediaKind;
  maxBytes: number;
  profile: DriveUploaderProfile;
  scene: string;
  /** When true the uploaded node is marked for the chat file library. */
  libraryMarker?: boolean;
}

const MEBIBYTE = 1024 * 1024;
/**
 * `appResourceType`/`scene`/`source` come from the application upload declaration
 * (`DRIVE_SPEC.md` section 18); only the transport-side sizing stays local.
 */
const UPLOAD_POLICIES: Record<AgentsDriveUploadPurpose, UploadPolicy> = {
  "agent-avatar": {
    appResourceType: AGENTS_AVATAR_UPLOAD.appResourceType,
    kind: "image",
    maxBytes: 10 * MEBIBYTE,
    profile: "avatar",
    scene: AGENTS_AVATAR_UPLOAD.scene,
  },
  "agent-chat-attachment": {
    appResourceType: AGENTS_SESSION_ATTACHMENT_UPLOAD.appResourceType,
    kind: "other",
    maxBytes: 100 * MEBIBYTE,
    profile: "attachment",
    scene: AGENTS_SESSION_ATTACHMENT_UPLOAD.scene,
    libraryMarker: true,
  },
  "agent-chat-image": {
    appResourceType: AGENTS_SESSION_IMAGE_UPLOAD.appResourceType,
    kind: "image",
    maxBytes: 25 * MEBIBYTE,
    profile: "image",
    scene: AGENTS_SESSION_IMAGE_UPLOAD.scene,
    libraryMarker: true,
  },
  "agent-chat-video": {
    appResourceType: AGENTS_SESSION_VIDEO_UPLOAD.appResourceType,
    kind: "video",
    maxBytes: 500 * MEBIBYTE,
    profile: "video",
    scene: AGENTS_SESSION_VIDEO_UPLOAD.scene,
    libraryMarker: true,
  },
  "agent-chat-voice": {
    appResourceType: AGENTS_SESSION_VOICE_UPLOAD.appResourceType,
    kind: "voice",
    maxBytes: 50 * MEBIBYTE,
    profile: "audio",
    scene: AGENTS_SESSION_VOICE_UPLOAD.scene,
    libraryMarker: true,
  },
  "agent-creative-image": {
    appResourceType: AGENTS_CREATIVE_IMAGE_UPLOAD.appResourceType,
    kind: "image",
    maxBytes: 25 * MEBIBYTE,
    profile: "image",
    scene: AGENTS_CREATIVE_IMAGE_UPLOAD.scene,
  },
  "agent-creative-audio": {
    appResourceType: AGENTS_CREATIVE_AUDIO_UPLOAD.appResourceType,
    kind: "audio",
    maxBytes: 50 * MEBIBYTE,
    profile: "audio",
    scene: AGENTS_CREATIVE_AUDIO_UPLOAD.scene,
  },
  "agent-creative-video": {
    appResourceType: AGENTS_CREATIVE_VIDEO_UPLOAD.appResourceType,
    kind: "video",
    maxBytes: 500 * MEBIBYTE,
    profile: "video",
    scene: AGENTS_CREATIVE_VIDEO_UPLOAD.scene,
  },
};

function validateUpload(file: File, policy: UploadPolicy): void {
  if (file.size <= 0) {
    throw new Error("Cannot upload an empty file.");
  }
  if (file.size > policy.maxBytes) {
    throw new Error(`File exceeds the ${Math.floor(policy.maxBytes / MEBIBYTE)} MiB upload limit.`);
  }
  if (policy.kind === "image" && !file.type.startsWith("image/")) {
    throw new Error("The selected file is not an image.");
  }
  if (policy.kind === "video" && !file.type.startsWith("video/")) {
    throw new Error("The selected file is not a video.");
  }
  if ((policy.kind === "audio" || policy.kind === "voice") && !file.type.startsWith("audio/")) {
    throw new Error("The selected file is not audio.");
  }
}

export class AgentsDriveUploadService {
  constructor(
    private readonly getClient: () => SdkworkAgentsDriveAppClient = getDriveAppSdkClientWithSession,
  ) {}

  async upload(request: AgentsDriveUploadRequest): Promise<AgentsDriveMediaResource> {
    const resourceId = request.resourceId.trim();
    if (!resourceId) {
      throw new Error("Drive upload requires a stable application resource id.");
    }
    const policy = UPLOAD_POLICIES[request.purpose];
    validateUpload(request.file, policy);
    const result = await this.getClient().uploader.uploadByProfile(policy.profile, {
      file: request.file,
      taskId: `agents-upload-${uuid()}`,
      appResourceType: policy.appResourceType,
      appResourceId: resourceId,
      scene: policy.scene,
      source: AGENTS_UPLOAD_SOURCE,
      uploadProfileCode: policy.profile,
      retention: { mode: "long_term" },
      signal: request.signal,
      onProgress: request.onProgress,
    });
    const { uploadItem } = result;
    if (!uploadItem.spaceId || !uploadItem.nodeId || result.uploadSession.state !== "completed") {
      throw new Error("Drive upload did not return a completed resource identity.");
    }
    if (policy.libraryMarker) {
      await this.markChatFileLibrary(uploadItem.nodeId);
    }
    const download = await this.getClient().drive.nodes.downloadUrls.retrieve(
      uploadItem.nodeId,
      { requestedTtlSeconds: 900 },
    );
    return {
      id: uploadItem.nodeId,
      kind: policy.kind,
      source: "drive",
      uri: `drive://spaces/${uploadItem.spaceId}/nodes/${uploadItem.nodeId}`,
      url: download.downloadUrl,
      fileName: uploadItem.originalFileName,
      mimeType: uploadItem.contentType,
      sizeBytes: uploadItem.contentLength,
      metadata: {
        driveSpaceId: uploadItem.spaceId,
        driveNodeId: uploadItem.nodeId,
        uploadItemId: uploadItem.id,
      },
    };
  }

  async resolvePreviewUrl(driveUri: string): Promise<string> {
    const match = /^drive:\/\/spaces\/[^/]+\/nodes\/([^/?#]+)$/u.exec(driveUri.trim());
    if (!match) {
      throw new Error("Invalid canonical Drive URI.");
    }
    const response = await this.getClient().drive.nodes.downloadUrls.retrieve(
      decodeURIComponent(match[1]),
      { requestedTtlSeconds: 900 },
    );
    return response.downloadUrl;
  }

  private async markChatFileLibrary(nodeId: string): Promise<void> {
    try {
      await this.getClient().drive.nodeProperties.update(nodeId, CHAT_FILE_LIBRARY_PROPERTY_KEY, {
        value: CHAT_FILE_LIBRARY_PROPERTY_VALUE,
        visibility: CHAT_FILE_LIBRARY_PROPERTY_VISIBILITY,
      });
    } catch (error) {
      // Marking is best-effort: the upload itself succeeded and the message
      // must still be sent even if the library marker could not be written.
      console.warn("Failed to mark chat file for the file library", error);
    }
  }
}

export const agentsDriveUploadService = new AgentsDriveUploadService();

/**
 * Builds the shared Drive image-upload service behind the agent avatar field
 * (`DRIVE_SPEC.md` section 18.3): the declared upload intent comes only from
 * `AGENTS_AVATAR_UPLOAD`, the composed uploader and the bounded preview reader
 * share the same Drive client getter the `AgentsDriveUploadService` uses, and
 * the resulting `DriveUploadImageService` is what avatar UI receives — it
 * never composes `appResourceType`/`scene`/`source` inline and never sees the
 * SDK client.
 */
export function createAgentAvatarUploadImageService(
  getClient: () => SdkworkAgentsDriveAppClient = getDriveAppSdkClientWithSession,
): DriveUploadImageService {
  const client = getClient();
  return createDriveUploadImageService({
    uploader: client.uploader,
    declaration: AGENTS_AVATAR_UPLOAD,
    previewReader: createDriveNodesImagePreviewReader(client.drive.nodes),
  });
}
