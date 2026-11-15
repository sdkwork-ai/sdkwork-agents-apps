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
  /** Called when a local agent finished package upload, or as the fallback. */
  onCompleted?(agent: AgentConfig): void;
  /**
   * Called for a conversation agent after its basic record exists. The console
   * navigates to `/console/agents/editor/<id>`; a host without that page may
   * omit it and receive `onCompleted` instead.
   */
  onContinueToEditor?(agent: AgentConfig): void;
  initialDraft?: Partial<AgentBasicsDraft>;
  categories?: readonly AgentCategoryNode[];
  localEngines?: readonly LocalAgentEngine[];
  /** Transport override for embedding hosts; defaults to `agentService`. */
  services?: Partial<AgentCreationServices>;
  baseConfig?: AgentCreationBaseConfig;
  title?: string;
}

type CreationStep = 'basics' | 'package';

const DEFAULT_BASE_CONFIG: AgentCreationBaseConfig = { type: 'normal' };

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

/**
 * Reusable agent creation flow: basic information first, then the step that
 * matches the delivery shape.
 *
 * - `local-execution`: upload the zip installation archive in place; no editor.
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
  initialDraft,
  categories,
  localEngines,
  services,
  baseConfig = DEFAULT_BASE_CONFIG,
  title = '创建智能体',
}: AgentCreationFlowProps) {
  const [step, setStep] = useState<CreationStep>('basics');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdAgent, setCreatedAgent] = useState<AgentConfig | null>(null);
  const [draft, setDraft] = useState<AgentBasicsDraft | null>(null);

  const resolvedServices = useMemo<AgentCreationServices>(
    () => ({ ...createDefaultServices(), ...services }),
    [services],
  );

  const reset = (): void => {
    setStep('basics');
    setBusy(false);
    setError('');
    setCreatedAgent(null);
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
    } else {
      toast(`智能体「${agent.name}」创建成功`, 'success');
    }
  };

  const handleBasicsSubmit = async (
    nextDraft: AgentBasicsDraft,
    avatar: AgentAvatarSubmission,
  ): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const created = await resolvedServices.createAgent(
        buildAgentConfigFromBasics(nextDraft, baseConfig),
      );
      if (!created.id) {
        throw new Error('Created agent id is required');
      }
      let agent = created;
      if (avatar.hasPending) {
        const avatarUri = await avatar.uploadPending(created.id);
        if (avatarUri) {
          agent = await resolvedServices.updateAgent(created.id, { avatar: avatarUri });
        }
      }
      if (requiresPackageUpload(nextDraft)) {
        setDraft(nextDraft);
        setCreatedAgent(agent);
        setStep('package');
        return;
      }
      const continueToEditor = onContinueToEditor;
      if (continueToEditor) {
        reset();
        continueToEditor(agent);
        return;
      }
      finish(agent);
    } catch (submitError) {
      console.error('Agent creation failed', submitError);
      setError('创建智能体失败，请检查服务连接后重试');
    } finally {
      setBusy(false);
    }
  };

  const handleArchiveUploaded = async (
    distribution: AgentArchiveDistribution,
  ): Promise<void> => {
    if (!createdAgent?.id) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      const engine = draft?.runtimeEngine;
      // Keep the catalog archive identity and entrypoint of the chosen engine;
      // the upload only contributes the stable Drive locator and integrity
      // evidence.
      const base = buildLocalArchiveDistribution(engine);
      const updated = await resolvedServices.updateAgent(createdAgent.id, {
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
    return (
      <>
        <ModalWrapper
          isOpen={open}
          onClose={close}
          title={`上传「${createdAgent?.name ?? draft?.name ?? ''}」安装包`}
          width="w-[520px]"
          footer={null}
        >
          <div className="space-y-4">
            <p className="text-[12px] leading-relaxed text-slate-500 dark:text-gray-400">
              本地执行智能体以 zip 安装包分发。上传后平台会登记 Drive 定位与 SHA-256
              校验和，Harness 运行时安装时据此校验完整性。
            </p>
            <AgentPackageUpload
              disabled={busy}
              onUploaded={(distribution) => void handleArchiveUploaded(distribution)}
              upload={(file, onProgress) =>
                resolvedServices.uploadPackage({
                  file,
                  agentId: createdAgent?.id ?? '',
                  onProgress,
                })
              }
            />
            {error ? (
              <div className="rounded bg-amber-500/5 p-2.5 text-[12px] leading-relaxed text-amber-600 dark:text-amber-400">
                {error}
              </div>
            ) : null}
            <button
              className="text-[12px] text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={close}
              type="button"
            >
              稍后上传，保留为草稿
            </button>
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
        localEngines={localEngines}
        onClose={close}
        onSubmit={(nextDraft, avatar) => void handleBasicsSubmit(nextDraft, avatar)}
        open={open}
        submitLabel="下一步"
        submitting={busy}
        title={title}
        initialDraft={initialDraft}
      />
      <ToastContainer />
    </>
  );
}
