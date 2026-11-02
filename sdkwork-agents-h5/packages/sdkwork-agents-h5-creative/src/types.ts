/**
 * Creative studio types (`app.agents.creative.studio`).
 *
 * A tool is one media tool the tenant can invoke; a run is one submitted
 * prompt and the media the tool returned. The transport DTO stays behind the
 * port so this package never depends on a provider envelope.
 */

export type CreativeModality = "image" | "video" | "music";

export type CreativeAspect = "square" | "landscape" | "portrait";

export type CreativeRunStatus = "pending" | "succeeded" | "failed";

export interface CreativeTool {
  readonly id: string;
  readonly modality: CreativeModality;
  readonly label: string;
  readonly description?: string;
  readonly supportsSize: boolean;
}

export interface CreativeMedia {
  readonly kind: "image" | "video" | "audio";
  readonly url: string;
}

export interface CreativeRun {
  readonly id: string;
  readonly toolId: string;
  readonly modality: CreativeModality;
  readonly prompt: string;
  readonly aspect: CreativeAspect;
  readonly status: CreativeRunStatus;
  readonly createdAt: string;
  readonly media: readonly CreativeMedia[];
  readonly error?: string;
}

export type CreativeCatalog =
  | { readonly availability: "available"; readonly tools: readonly CreativeTool[] }
  | {
      readonly availability: "unavailable";
      readonly tools: readonly CreativeTool[];
      readonly reason: "transport-not-composed" | "no-generation-tool";
    };
