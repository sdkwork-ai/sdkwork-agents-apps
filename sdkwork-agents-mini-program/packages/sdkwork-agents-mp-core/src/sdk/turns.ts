/**
 * Streaming turn helpers for the mini program runtime.
 *
 * The generated app SDK owns the SSE protocol; this module only re-exports it so
 * capability packages consume the canonical turn operations instead of building
 * raw HTTP calls (`APP_SDK_INTEGRATION_SPEC.md`).
 */
export {
  completeAgentTurn,
  completeAgentTurnStream,
  TURN_EVENT_PROTOCOL_KERNEL_V1,
} from "@sdkwork/agents-app-sdk";
export type {
  CompleteAgentTurnResult,
  CreateAgentTurnRequest,
  TurnRichToolEvent,
  TurnStreamHandlers,
} from "@sdkwork/agents-app-sdk";
