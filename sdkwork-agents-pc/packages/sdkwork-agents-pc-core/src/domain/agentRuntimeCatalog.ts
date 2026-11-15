/**
 * Agent delivery shapes and runtime descriptors shared by every agent surface.
 *
 * Authority: `sdkwork-agents/specs/AGENTS_AGENT_KIND_AND_RUNTIME_SPEC.md` and
 * `sdkwork-agents/specs/AGENTS_PROVIDER_TAXONOMY_SPEC.md`.
 *
 * - `conversation` agents run in the managed runtime and default to the Rig
 *   Rust implementation (T3 framework agent).
 * - `local-execution` agents are distributed as zip archives and executed by
 *   the local Harness runtime; the engine names which product the archive
 *   installs.
 *
 * The manifest carries these descriptors, so the console can render and filter
 * agents without a provider-specific API field.
 */

export type AgentKind = 'conversation' | 'local-execution';

/** Agent manifest runtime descriptor (`manifest.runtime`). */
export interface AgentRuntimeDescriptor {
  family: string;
  engine: string;
  protocol?: string;
  implementation_kind?: string;
  implementation_type?: string;
  provider_id?: string;
  capabilities?: string[];
}

/** Archive distribution descriptor for a locally installed agent. */
export interface AgentArchiveDistribution {
  kind: 'archive';
  format: 'zip';
  archiveRef?: string;
  version?: string;
  entrypoint?: string;
  installMode?: 'extract';
  /** Stable Drive locator returned by an uploaded archive. */
  driveUri?: string;
  fileName?: string;
  sizeBytes?: string;
  /** SHA-256 of the uploaded archive, computed in the browser before upload. */
  checksum?: string | null;
}

export type AgentDistribution = AgentArchiveDistribution | { kind: 'manifest' } | null;

export const CONVERSATION_RUNTIME: AgentRuntimeDescriptor = {
  family: 'rig',
  engine: 'rig',
  implementation_kind: 'typed-local-provider',
  implementation_type: 'rig-rust',
  provider_id: 'provider.rig.rust',
  capabilities: ['model.chat', 'tool.invoke', 'knowledge.retrieve', 'memory.retrieve', 'session.resume'],
};

export const HARNESS_RUNTIME_PROTOCOL = 'harness.agent.runtime.v1';
export const HARNESS_RUNTIME_PROVIDER_ID = 'provider.harness.local';

/**
 * Local harness engines the platform can install.
 *
 * `archiveRef` is the catalog archive reference the Harness package registry
 * resolves; a user-uploaded archive replaces it with the uploaded Drive locator.
 */
export interface LocalAgentEngine {
  id: string;
  label: string;
  description: string;
  implementationKind: 'process-adapter' | 'protocol-adapter';
  archiveRef: string;
  entrypoint: string;
}

export const LOCAL_AGENT_ENGINES: readonly LocalAgentEngine[] = [
  {
    id: 'openclaw',
    label: 'OpenClaw',
    description: '自主执行多步桌面任务的本地智能体。',
    implementationKind: 'process-adapter',
    archiveRef: 'archive.sdkwork.openclaw',
    entrypoint: 'openclaw/manifest.json',
  },
  {
    id: 'workbuddy',
    label: 'WorkBuddy',
    description: '操作本地文件、表格与桌面应用的工作助理。',
    implementationKind: 'process-adapter',
    archiveRef: 'archive.sdkwork.workbuddy',
    entrypoint: 'workbuddy/manifest.json',
  },
  {
    id: 'codex',
    label: 'Codex CLI',
    description: '在本地仓库中读写代码并验证变更。',
    implementationKind: 'protocol-adapter',
    archiveRef: 'archive.sdkwork.codex-cli',
    entrypoint: 'codex/manifest.json',
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    description: '以本地 CLI 理解代码库并执行改动。',
    implementationKind: 'protocol-adapter',
    archiveRef: 'archive.sdkwork.claude-code',
    entrypoint: 'claude-code/manifest.json',
  },
  {
    id: 'gemini-cli',
    label: 'Gemini CLI',
    description: '在本地终端完成检索与多步骤任务。',
    implementationKind: 'protocol-adapter',
    archiveRef: 'archive.sdkwork.gemini-cli',
    entrypoint: 'gemini-cli/manifest.json',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    description: '连接本地模型与仓库的开源编码智能体。',
    implementationKind: 'protocol-adapter',
    archiveRef: 'archive.sdkwork.opencode',
    entrypoint: 'opencode/manifest.json',
  },
  {
    id: 'hermes',
    label: 'Hermes',
    description: '面向长任务的本地自治智能体，支持断点续跑。',
    implementationKind: 'process-adapter',
    archiveRef: 'archive.sdkwork.hermes-agent',
    entrypoint: 'hermes/manifest.json',
  },
];

export const DEFAULT_LOCAL_AGENT_ENGINE_ID = 'openclaw';

export function findLocalAgentEngine(engineId: string | undefined): LocalAgentEngine {
  return (
    LOCAL_AGENT_ENGINES.find((engine) => engine.id === engineId) ??
    LOCAL_AGENT_ENGINES[0]
  );
}

/** Runtime descriptor for a hosted conversation agent (Rig by default). */
export function buildConversationRuntime(): AgentRuntimeDescriptor {
  return { ...CONVERSATION_RUNTIME, capabilities: [...(CONVERSATION_RUNTIME.capabilities ?? [])] };
}

/** Runtime descriptor for a locally installed agent. */
export function buildLocalExecutionRuntime(engineId: string | undefined): AgentRuntimeDescriptor {
  const engine = findLocalAgentEngine(engineId);
  return {
    family: 'harness',
    engine: engine.id,
    protocol: HARNESS_RUNTIME_PROTOCOL,
    implementation_kind: engine.implementationKind,
    implementation_type: 'custom',
    provider_id: HARNESS_RUNTIME_PROVIDER_ID,
    capabilities: [
      'tool.invoke',
      'shell.exec',
      'file.read',
      'file.write',
      'process.manage',
      'session.resume',
    ],
  };
}

/** Archive descriptor for a locally installed agent before an upload exists. */
export function buildLocalArchiveDistribution(
  engineId: string | undefined,
): AgentArchiveDistribution {
  const engine = findLocalAgentEngine(engineId);
  return {
    kind: 'archive',
    format: 'zip',
    archiveRef: engine.archiveRef,
    version: '1.0.0',
    entrypoint: engine.entrypoint,
    installMode: 'extract',
    checksum: null,
  };
}

export function isAgentKind(value: unknown): value is AgentKind {
  return value === 'conversation' || value === 'local-execution';
}

export function isAgentArchiveDistribution(value: unknown): value is AgentArchiveDistribution {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { kind?: unknown; format?: unknown };
  return candidate.kind === 'archive' && candidate.format === 'zip';
}
