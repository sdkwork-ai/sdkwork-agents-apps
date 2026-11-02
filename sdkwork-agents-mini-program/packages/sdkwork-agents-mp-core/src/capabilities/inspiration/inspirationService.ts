import {
  type AgentsMpInspirationAvailability,
  type AgentsMpInspirationFeed,
  type AgentsMpInspirationItem,
  type AgentsMpInspirationSegment,
  type AgentsMpInspirationUnavailableReason,
} from "./inspirationModels";

/**
 * Inspiration feed orchestration.
 *
 * The page asks this service for a segment; the service owns the one fact the
 * page must not guess — whether this runtime has a feed transport at all. When it
 * does not, the result says so and the page renders its localized unavailable
 * state with retry. When a feed port is injected (the M3 transport), the same
 * page renders real items without a UI change.
 */
export interface AgentsMpInspirationFeedPort {
  listSegment(
    segment: AgentsMpInspirationSegment,
    cursor?: string,
  ): Promise<{ items: AgentsMpInspirationItem[]; nextCursor?: string | null }>;
}

export interface AgentsMpInspirationService {
  readonly availability: AgentsMpInspirationAvailability;
  readonly unavailableReason?: AgentsMpInspirationUnavailableReason;
  loadFeed(segment: AgentsMpInspirationSegment): Promise<AgentsMpInspirationFeed>;
}

/**
 * Creates the inspiration service.
 *
 * `port` is absent in this root: the compose root injects only the Agents and
 * Drive app SDK clients, and neither exposes a feeds stream. Passing a port
 * switches the service to `available` without changing its signature.
 */
export function createAgentsMpInspirationService(
  port?: AgentsMpInspirationFeedPort,
): AgentsMpInspirationService {
  if (!port) {
    return {
      availability: "unavailable",
      unavailableReason: "transport-not-composed",
      async loadFeed(segment) {
        return {
          segment,
          availability: "unavailable",
          items: [],
          reason: "transport-not-composed",
        };
      },
    };
  }

  return {
    availability: "available",
    async loadFeed(segment) {
      const page = await port.listSegment(segment);
      return {
        segment,
        availability: "available",
        items: page.items,
        nextCursor: page.nextCursor ?? null,
      };
    },
  };
}
