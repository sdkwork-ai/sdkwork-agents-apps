/**
 * Creation-flow model shared by every surface that creates an agent.
 *
 * The flow is deliberately split from the editor: this module owns the basic
 * information draft and the create request shape, the dialog owns step one, and
 * the host owns where a conversation agent goes next (the console editor page).
 */

import type { AgentConfig } from '../services/AgentService';
import type { AgentArchiveDistribution, AgentKind } from '../services/agentRuntimeCatalog';
import {
  buildLocalArchiveDistribution,
  DEFAULT_LOCAL_AGENT_ENGINE_ID,
} from '../services/agentRuntimeCatalog';

/** Basic information collected before any type-specific step. */
export interface AgentBasicsDraft {
  name: string;
  description: string;
  /** Professional leaf category code; `local-execution` for local agents. */
  categoryId: string;
  agentKind: AgentKind;
  /** Harness engine for a local agent; ignored for conversation agents. */
  runtimeEngine?: string;
}

/** Avatar picked in step one, which may still be pending upload. */
export interface AgentAvatarSubmission {
  /** Persisted avatar uri (`drive://...` or a legacy url), or empty. */
  uri: string;
  /** True when the user picked an image that needs an agent id to upload. */
  hasPending: boolean;
  /** Uploads every pending pick against the created agent and returns its uri. */
  uploadPending(agentId: string): Promise<string | undefined>;
}

/** Services the creation flow needs; the default wiring is `agentService`. */
export interface AgentCreationServices {
  createAgent(config: AgentConfig): Promise<AgentConfig>;
  updateAgent(id: string, patch: Partial<AgentConfig>): Promise<AgentConfig>;
  uploadPackage(input: {
    file: File;
    agentId: string;
    onProgress?: (ratio: number) => void;
  }): Promise<AgentArchiveDistribution>;
}

export const EMPTY_AGENT_BASICS: AgentBasicsDraft = {
  name: '',
  description: '',
  categoryId: '',
  agentKind: 'conversation',
  runtimeEngine: DEFAULT_LOCAL_AGENT_ENGINE_ID,
};

/** Defaults applied to a created agent before its type-specific configuration. */
export interface AgentCreationBaseConfig {
  type: AgentConfig['type'];
  model?: string;
  temperature?: number;
  memoryEnabled?: boolean;
  suggestedPrompts?: string[];
}

export interface BuildAgentConfigOptions {
  /**
   * When editing an existing local agent, keep its current archive descriptor
   * instead of resetting it to the catalog reference. Defaults to `true` for
   * creation.
   */
  includeLocalArchive?: boolean;
}

/**
 * Builds the persisted agent configuration from step-one values.
 *
 * A local agent is created as a `normal` agent with the `host` execution route;
 * a conversation agent keeps the hosted defaults the editor then refines.
 * `distribution` starts as the catalog archive reference for local agents so
 * the record is valid even before the archive upload lands; the upload replaces
 * it with the Drive locator and checksum. Editing an existing local agent
 * passes `includeLocalArchive: false` so its uploaded archive is not reset.
 */
export function buildAgentConfigFromBasics(
  draft: AgentBasicsDraft,
  base: AgentCreationBaseConfig = { type: 'normal' },
  options: BuildAgentConfigOptions = {},
): AgentConfig {
  const agentKind = draft.agentKind;
  const includeLocalArchive = options.includeLocalArchive ?? true;
  const runtimeEngine =
    agentKind === 'local-execution'
      ? draft.runtimeEngine ?? DEFAULT_LOCAL_AGENT_ENGINE_ID
      : undefined;
  return {
    ...base,
    name: draft.name.trim(),
    description: draft.description.trim(),
    categoryId:
      agentKind === 'local-execution' ? 'local-execution' : draft.categoryId.trim(),
    agentKind,
    runtimeEngine,
    ...(agentKind === 'local-execution'
      ? {
          type: 'normal' as const,
          // Local agents execute on the host; the managed in-process route
          // would place them where their archive does not exist.
          executionRoute: 'host' as const,
          ...(includeLocalArchive
            ? { distribution: buildLocalArchiveDistribution(runtimeEngine) }
            : {}),
        }
      : { type: base.type }),
  };
}

/** True when step two is the archive upload instead of the editor page. */
export function requiresPackageUpload(draft: Pick<AgentBasicsDraft, 'agentKind'>): boolean {
  return draft.agentKind === 'local-execution';
}

/** Human-readable label for an agent kind, used by lists and dialogs. */
export function agentKindLabel(kind: AgentKind | undefined): string {
  return kind === 'local-execution' ? '本地执行' : '对话类';
}
