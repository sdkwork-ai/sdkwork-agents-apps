import {
  getMemoryAppSdkClientWithSession,
} from "@sdkwork/agents-pc-core/sdk/memoryAppSdkClient";
import { resolveAppSdkUserId } from "@sdkwork/agents-pc-core/session";

import {
  AgentMemoryService as AgentMemorySemantics,
  type AgentMemoryClientLike,
} from "./agentMemoryModel";

/**
 * The Memory binding for the agent editor.
 *
 * All the rules — which space is the default, what `space_type` a new memory
 * gets, how a copy is made, what a save does to the composition slot — live in
 * `agentMemoryModel`, which imports no SDK. This module supplies the two things
 * that module refuses to know about: the generated Memory client and the
 * signed-in user. That split is what lets those rules be tested without a build
 * of the Memory SDK tree, and it keeps the SDK surface this feature depends on
 * pinned in exactly one place.
 */

/**
 * The real client, narrowed to the surface the semantics module uses.
 *
 * Deliberately not a cast: returning the SDK client where
 * {@link AgentMemoryClientLike} is expected makes the compiler prove the two
 * still agree, so a regenerated SDK that renames or moves a route fails here
 * rather than at the user's first click.
 */
function getDefaultMemoryClient(): AgentMemoryClientLike {
  return getMemoryAppSdkClientWithSession();
}

export const agentMemoryService = new AgentMemorySemantics(
  getDefaultMemoryClient,
  () => resolveAppSdkUserId(),
);

export {
  AgentMemoryError,
  AgentMemoryService,
  DEFAULT_MEMORY_DISPLAY_NAME,
  DEFAULT_MEMORY_SPACE_TYPE,
  MAX_CLONED_RECORDS,
  USER_MEMORY_SPACE_TYPE_PREFIX,
  createUserMemorySpaceType,
  toRecordRequest,
} from "./agentMemoryModel";
export type {
  AgentMemoryClientLike,
  AgentMemoryOption,
  CloneAgentMemoryResult,
  MemoryRecordLike,
  MemoryRecordRequestLike,
  MemorySpaceLike,
} from "./agentMemoryModel";
