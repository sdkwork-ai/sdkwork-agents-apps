import React, { useMemo, useState } from 'react';

import { ModalWrapper } from '../components/ModalWrapper';
import { ToastContainer, toast } from '../components/Toast';
import { agentService, type AgentConfig } from '../services/AgentService';
import { agentsDriveUploadService } from '@sdkwork/agents-pc-core/sdk/driveUploadService';
import {
  buildLocalArchiveDistribution,
  type AgentArchiveDistribution,
  type LocalAgentEngine,
} from '../services/agentRuntimeCatalog';
import type { AgentCategoryNode } from '../services/agentTaxonomy';
import { AgentBasicInfoDialog } from './AgentBasicInfoDialog';
import { AgentPackageUpload } from './AgentPackageUpload';
import {
  buildAgentConfigFromBasics,
  requiresPackageUpload,
  type AgentAvatarSubmission,
  type AgentBasicsDraft,
  type AgentCreationBaseConfig,
  type AgentCreationServices,
} from './agentCreationModel';

export interface AgentCreationFlowProps {
  open: boolean;
  onClose(): void;
  /** Called when the flow finished (local upload or conversation handoff fallback). */
  onCompleted?(agent: AgentConfig): void;
  /**
   * Called for a conversation agent after its basic record exists. The console
   * navigates to `/console/agents/editor/<id>`; a host without that page may
   * omit it and receive `onCompleted` instead.
   */
  onContinueToEditor?(agent: AgentConfig): void;
  /**
   * Existing agent to reconfigure. Only local-execution agents use this flow for
   * editing: basic information is persisted, then the package can be replaced
   * or kept. Conversation agents are edited by the detail editor.
   */
  existingAgent?: AgentConfig;
  initialDraft?: Partial<AgentBasicsDraft>;
  categories?: readonly AgentCategoryNode[];
  localEngines?: readonly LocalAgentEngine[];
  /** Transport override for embedding hosts; defaults to `agentService`. */
  services?: Partial<AgentCreationServices>;
  baseConfig?: AgentCreationBaseConfig;
  title?: string;
}

type FlowStep = 'basics' | 'package';

const DEFAULT_BASE_CONFIG: AgentCreationBaseConfig = { type: 'normal' };

const MEBIBYTE = 1024 * 1024;

function formatPackageSize(sizeBytes: string | undefined): string {
  const bytes = Number(sizeBytes);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '';
  }
  return bytes >= MEBIBYTE ? `${(bytes / MEBIBYTE).toFixed(1)} MiB` : `${Math.round(bytes / 1024)} KiB`;
}

function createDefaultServices(): AgentCreationServices {
  return {
    createAgent: (config) => agentService.createAgent(config),
    updateAgent: (id, patch) => agentService.updateAgent(id, patch),
    uploadPackage: async ({ file, agentId, onProgress }) => {
      const media = await agentsDriveUploadService.upload({
        file,
        purpose: 'agent-package',
        resourceId: agentId,
        onProgress: (progress) => {
          const total = progress.totalBytes || file.size || 1;
          onProgress?.(Math.min(1, progress.uploadedBytes / total));
        },
      });
      // The flow merges the engine's catalog archive reference and entrypoint
      // into this descriptor; the upload contributes the stable Drive locator.
      return {
        ...buildLocalArchiveDistribution(undefined),
        driveUri: media.uri,
        fileName: media.fileName,
        sizeBytes: media.sizeBytes,
        checksum: null,
      };
    },
  };
}

function draftFromExistingAgent(agent: AgentConfig): AgentBasicsDraft {
  return {
    name: agent.name,
    description: agent.description,
    categoryId: agent.categoryId ?? '',
    agentKind: agent.agentKind ?? 'conversation',
    runtimeEngine: agent.runtimeEngine,
  };
}

/**
 * Reusable agent creation and local-agent reconfigure flow.
 *
 * - `local-execution`: basic information, then the zip installation archive.
 *   With `existingAgent`, the basics are updated and the package can be
 *   replaced or kept; the conversation editor is never opened.
 * - `conversation`: hand the created record to the host's editor page.
 *
 * The component owns the steps and persistence order, and takes its transport
 * through `services`, so the console, the admin surface and the standalone app
 * can mount the same flow with different shells.
 */
export function AgentCreationFlow({
  open,
  onClose,
  onCompleted,
  onContinueToEditor,
  existingAgent,
  initialDraft,
  categories,
  localEngines,
  services,
  baseConfig = DEFAULT_BASE_CONFIG,
  title,
}: AgentCreationFlowProps) {
  const [step, setStep] = useState<FlowStep>('basics');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [agentRecord, setAgentRecord] = useState<AgentConfig | null>(null);
  const [draft, setDraft] = useState<AgentBasicsDraft | null>(null);

  const editingId = existingAgent?.id;
  const resolvedServices = useMemo<AgentCreationServices>(
    () => ({ ...createDefaultServices(), ...services }),
    [services],
  );
  const dialogDraft = useMemo<Partial<AgentBasicsDraft> | undefined>(() => {
    const base = existingAgent ? draftFromExistingAgent(existingAgent) : undefined;
    return base || initialDraft ? { ...base, ...initialDraft } : undefined;
  }, [existingAgent, initialDraft]);

  const reset = (): void => {
    setStep('basics');
    setBusy(false);
    setError('');
    setAgentRecord(null);
    setDraft(null);
  };

  const close = (): void => {
    reset();
    onClose();
  };

  const finish = (agent: AgentConfig): void => {
    reset();
    if (onCompleted) {
      onCompleted(agent);
      return;
    }
    toast(`智能体「${agent.name}」已保存`, 'success');
  };

  const handleBasicsSubmit = async (
    nextDraft: AgentBasicsDraft,
    avatar: AgentAvatarSubmission,
  ): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      let agent: AgentConfig;
      if (editingId) {
        agent = await resolvedServices.updateAgent(
          editingId,
          buildAgentConfigFromBasics(nextDraft, baseConfig, {
            // Reconfiguring a local agent must not reset an uploaded archive to
            // the catalog reference; step two decides whether to replace it.
            includeLocalArchive: false,
          }),
        );
      } else {
        const created = await resolvedServices.createAgent(
          buildAgentConfigFromBasics(nextDraft, baseConfig),
        );
        if (!created.id) {
          throw new Error('Created agent id is required');
        }
        agent = created;
      }
      if (!agent.id) {
        throw new Error('Agent id is required');
      }
      if (avatar.hasPending) {
        const avatarUri = await avatar.uploadPending(agent.id);
        if (avatarUri) {
          agent = await resolvedServices.updateAgent(agent.id, { avatar: avatarUri });
        }
      }
      if (requiresPackageUpload(nextDraft)) {
        setDraft(nextDraft);
        setAgentRecord(agent);
        setStep('package');
        return;
      }
      if (onContinueToEditor) {
        reset();
        onContinueToEditor(agent);
        return;
      }
      finish(agent);
    } catch (submitError) {
      console.error('Agent save failed', submitError);
      setError(
        editingId
          ? '保存智能体失败，请检查服务连接后重试'
          : '创建智能体失败，请检查服务连接后重试',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleArchiveUploaded = async (
    distribution: AgentArchiveDistribution,
  ): Promise<void> => {
    if (!agentRecord?.id) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      const engine = draft?.runtimeEngine ?? agentRecord.runtimeEngine;
      // Keep the catalog archive identity and entrypoint of the chosen engine;
      // the upload only contributes the stable Drive locator and integrity
      // evidence.
      const base = buildLocalArchiveDistribution(engine);
      const updated = await resolvedServices.updateAgent(agentRecord.id, {
        distribution: {
          ...base,
          driveUri: distribution.driveUri,
          fileName: distribution.fileName,
          sizeBytes: distribution.sizeBytes,
          checksum: distribution.checksum ?? null,
        },
      });
      finish(updated);
    } catch (updateError) {
      console.error('Local agent package registration failed', updateError);
      setError('安装包已上传，但写入智能体失败，请重试');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return null;
  }

  if (step === 'package') {
    const distribution =
      agentRecord?.distribution?.kind === 'archive' ? agentRecord.distribution : null;
    const packageLabel = distribution?.fileName
      ?? distribution?.archiveRef
      ?? '目录安装包';
    const packageSize = formatPackageSize(distribution?.sizeBytes);
    const isUploaded = Boolean(distribution?.driveUri);
    const driveUri = distribution?.driveUri ?? '';
    const engineChanged = Boolean(
      editingId
      && existingAgent?.runtimeEngine
      && agentRecord?.runtimeEngine
      && existingAgent.runtimeEngine !== agentRecord.runtimeEngine,
    );
    return (
      <>
        <ModalWrapper
          isOpen={open}
          onClose={close}
          title={`${editingId ? '更新' : '上传'}「${agentRecord?.name ?? draft?.name ?? ''}」安装包`}
          width="w-[520px]"
          footer={null}
        >
          <div className="space-y-4">
            <p className="text-[12px] leading-relaxed text-slate-500 dark:text-gray-400">
              本地执行智能体以 zip 安装包分发。上传后平台会登记 Drive 定位与 SHA-256
              校验和，Harness 运行时安装时据此校验完整性。
              {editingId
                ? ''
                : '创建后保持草稿状态，安装与启用由本地 Harness 客户端完成。'}
            </p>

            {distribution ? (
              <div className="rounded-lg bg-slate-900/[0.04] dark:bg-white/[0.04] p-3 text-[12px] leading-relaxed text-slate-600 dark:text-gray-300">
                <div className="font-medium text-slate-800 dark:text-gray-100">当前安装包</div>
                <div className="mt-1 break-all">
                  {packageLabel}
                  {packageSize ? ` · ${packageSize}` : ''}
                  {isUploaded ? ' · 已上传' : ' · 目录引用（未上传）'}
                </div>
                {distribution.checksum ? (
                  <div className="mt-1 font-mono text-[10px] text-slate-500 dark:text-gray-500 break-all">
                    sha256:{distribution.checksum}
                  </div>
                ) : null}
                {driveUri ? (
                  <button
                    className="mt-2 text-[11px] font-medium text-[#165DFF] hover:text-[#4080FF] dark:text-[#6ea8ff]"
                    onClick={() => {
                      void agentsDriveUploadService
                        .resolvePreviewUrl(driveUri)
                        .then((url) => window.open(url, '_blank', 'noopener,noreferrer'))
                        .catch((downloadError) => {
                          console.error('Failed to resolve the agent package download URL', downloadError);
                          toast('安装包下载地址获取失败，请稍后重试', 'error');
                        });
                    }}
                    type="button"
                  >
                    下载当前安装包
                  </button>
                ) : null}
              </div>
            ) : null}

            <AgentPackageUpload
              disabled={busy}
              onUploaded={(next) => void handleArchiveUploaded(next)}
              submitLabel={editingId ? '上传并更新' : '上传并完成创建'}
              upload={(file, onProgress) =>
                resolvedServices.uploadPackage({
                  file,
                  agentId: agentRecord?.id ?? '',
                  onProgress,
                })
              }
            />

            {engineChanged ? (
              <div className="rounded bg-amber-500/5 p-2.5 text-[12px] leading-relaxed text-amber-600 dark:text-amber-400">
                运行引擎已变更，请上传与新引擎匹配的安装包；当前安装包不能继续沿用。
              </div>
            ) : null}

            {error ? (
              <div className="rounded bg-amber-500/5 p-2.5 text-[12px] leading-relaxed text-amber-600 dark:text-amber-400">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              {editingId && distribution && !engineChanged ? (
                <button
                  className="text-[12px] text-[#165DFF] hover:text-[#4080FF] dark:text-[#6ea8ff]"
                  disabled={busy}
                  onClick={() => {
                    if (agentRecord) {
                      finish(agentRecord);
                    }
                  }}
                  type="button"
                >
                  保留当前安装包，完成
                </button>
              ) : (
                <span />
              )}
              {editingId ? null : (
                <button
                  className="text-[12px] text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={close}
                  type="button"
                >
                  稍后上传，保留为草稿
                </button>
              )}
            </div>
          </div>
        </ModalWrapper>
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <AgentBasicInfoDialog
        categories={categories}
        errorMessage={error}
        initialAvatar={existingAgent?.avatar}
        initialDraft={dialogDraft}
        localEngines={localEngines}
        onClose={close}
        onSubmit={(nextDraft, avatar) => void handleBasicsSubmit(nextDraft, avatar)}
        open={open}
        submitLabel="下一步"
        submitting={busy}
        title={title ?? (editingId ? '更新本地智能体' : '创建智能体')}
      />
      <ToastContainer />
    </>
  );
}
