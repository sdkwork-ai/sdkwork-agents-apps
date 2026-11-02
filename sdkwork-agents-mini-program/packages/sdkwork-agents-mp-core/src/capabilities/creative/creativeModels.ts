/**
 * Creative studio domain models for the Agents mini program.
 *
 * Generation runs through the media tool family the Agents app SDK exposes
 * (`/ai/tools` directory and `/ai/tools/{toolId}/invoke`). The PC creative
 * surface composes the dedicated generations SDK, which this root does not
 * include; media tools are the generation transport this runtime actually has, so
 * the page is backed by a real request instead of a placeholder.
 */

export type AgentsMpCreativeModality = "image" | "video" | "music";

/** Media kinds a generation result can render. */
export type AgentsMpCreativeMediaKind = "image" | "video" | "audio" | "other";

/** Requested aspect, mapped to a provider size when the tool schema accepts one. */
export type AgentsMpCreativeAspect = "square" | "landscape" | "portrait";

export interface AgentsMpCreativeMedia {
  readonly kind: AgentsMpCreativeMediaKind;
  readonly url: string;
}

/** One prompt-capable generation tool from the media tool directory. */
export interface AgentsMpCreativeTool {
  readonly id: string;
  readonly modality: AgentsMpCreativeModality;
  readonly label: string;
  readonly description?: string;
  /** True when the tool's input schema declares a `size` property. */
  readonly supportsSize: boolean;
  /** True when the tool's input schema declares `saveToDrive`. */
  readonly saveToDriveDefault: boolean;
}

export type AgentsMpCreativeAvailability = "available" | "unavailable";

export type AgentsMpCreativeUnavailableReason = "no-generation-tool" | "transport-not-composed";

export interface AgentsMpCreativeCatalog {
  readonly availability: AgentsMpCreativeAvailability;
  readonly tools: AgentsMpCreativeTool[];
  readonly reason?: AgentsMpCreativeUnavailableReason;
}

export type AgentsMpCreativeRunStatus = "succeeded" | "failed" | "pending";

/** One generation attempt. Persisted on the device by the injected store. */
export interface AgentsMpCreativeRun {
  readonly id: string;
  readonly toolCallId: string;
  readonly toolId: string;
  readonly modality: AgentsMpCreativeModality;
  readonly prompt: string;
  readonly aspect: AgentsMpCreativeAspect;
  readonly status: AgentsMpCreativeRunStatus;
  readonly createdAt: string;
  readonly media: AgentsMpCreativeMedia[];
  /** Server-provided failure detail, when the invocation reported one. */
  readonly error?: string;
}

/**
 * Device-local run history.
 *
 * The MP runtime has no generation-record listing endpoint (that belongs to the
 * generations SDK), so the studio keeps its own run log on the device and labels
 * it as such. It never pretends to be the server-side conversation list.
 */
export interface AgentsMpCreativeRunStore {
  read(): AgentsMpCreativeRun[];
  write(runs: readonly AgentsMpCreativeRun[]): void;
}
