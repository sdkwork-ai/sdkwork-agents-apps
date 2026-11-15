import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Package } from 'lucide-react';
import {
  DriveUploadImage,
  useDriveUploadImageController,
  useDriveUploadImageSnapshot,
} from 'sdkwork-drive-pc-upload-image';
import { createAgentAvatarUploadImageService } from '@sdkwork/agents-pc-core/sdk/driveUploadService';

import { ModalWrapper } from '../components/ModalWrapper';
import {
  AGENT_CATEGORY_TAXONOMY,
  type AgentCategoryNode,
} from '../services/agentTaxonomy';
import {
  DEFAULT_LOCAL_AGENT_ENGINE_ID,
  LOCAL_AGENT_ENGINES,
  type LocalAgentEngine,
} from '../services/agentRuntimeCatalog';
import {
  EMPTY_AGENT_BASICS,
  type AgentAvatarSubmission,
  type AgentBasicsDraft,
} from './agentCreationModel';

const AVATAR_UPLOAD_COPY = {
  pickImage: '上传头像',
  replaceImage: '更换头像',
  removeImage: '移除',
  retryUpload: '重试',
  uploading: '上传中',
  uploadFailed: '上传失败',
} as const;

export interface AgentBasicInfoDialogProps {
  open: boolean;
  onClose(): void;
  /** Pre-fills the dialog; used when a host reopens creation. */
  initialDraft?: Partial<AgentBasicsDraft>;
  /** Professional category tree; defaults to the seeded taxonomy. */
  categories?: readonly AgentCategoryNode[];
  /** Local harness engines; defaults to the platform engine catalog. */
  localEngines?: readonly LocalAgentEngine[];
  title?: string;
  submitLabel?: string;
  submitting?: boolean;
  errorMessage?: string;
  onSubmit(draft: AgentBasicsDraft, avatar: AgentAvatarSubmission): void | Promise<void>;
}

/**
 * Step one of agent creation: basic information and the delivery shape.
 *
 * The dialog knows nothing about transport. It reports the draft and an avatar
 * handle; the flow persists the agent, then uploads a pending avatar against
 * the new id (`DRIVE_SPEC.md` section 18.3 persist-first).
 */
export function AgentBasicInfoDialog({
  open,
  onClose,
  initialDraft,
  categories = AGENT_CATEGORY_TAXONOMY,
  localEngines = LOCAL_AGENT_ENGINES,
  title = '创建智能体',
  submitLabel = '下一步',
  submitting = false,
  errorMessage,
  onSubmit,
}: AgentBasicInfoDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [agentKind, setAgentKind] = useState<AgentBasicsDraft['agentKind']>('conversation');
  const [runtimeEngine, setRuntimeEngine] = useState<string>(DEFAULT_LOCAL_AGENT_ENGINE_ID);
  const [validationError, setValidationError] = useState('');

  const avatarService = useMemo(() => createAgentAvatarUploadImageService(), []);
  const avatarController = useDriveUploadImageController({
    service: avatarService,
    // The agent does not exist yet: every pick stays pending and uploads with
    // the created id after the create call succeeds.
    resolveAppResourceId: () => null,
  });
  const avatarSnapshot = useDriveUploadImageSnapshot(avatarController);

  useEffect(() => {
    if (!open) {
      return;
    }
    const next = { ...EMPTY_AGENT_BASICS, ...initialDraft };
    setName(next.name);
    setDescription(next.description);
    setCategoryId(next.categoryId);
    setAgentKind(next.agentKind);
    setRuntimeEngine(next.runtimeEngine ?? DEFAULT_LOCAL_AGENT_ENGINE_ID);
    setValidationError('');
    avatarController.clear();
    // The avatar controller is stable for the dialog lifetime; re-running on
    // open is what discards a previous session's pending pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) {
    return null;
  }

  const isLocal = agentKind === 'local-execution';
  const effectiveCategoryId = isLocal ? 'local-execution' : categoryId;

  const submit = async (): Promise<void> => {
    if (!name.trim()) {
      setValidationError('请输入智能体名称');
      return;
    }
    if (!effectiveCategoryId) {
      setValidationError('请选择行业分类');
      return;
    }
    setValidationError('');
    await onSubmit(
      {
        name: name.trim(),
        description: description.trim(),
        categoryId: effectiveCategoryId,
        agentKind,
        runtimeEngine: isLocal ? runtimeEngine : undefined,
      },
      {
        uri: '',
        hasPending: avatarSnapshot.hasPending,
        uploadPending: async (agentId: string) => {
          const values = await avatarController.uploadPending({ appResourceId: agentId });
          return values[values.length - 1]?.uri;
        },
      },
    );
  };

  return (
    <ModalWrapper
      isOpen={open}
      onClose={onClose}
      title={title}
      width="w-[560px]"
      footer={
        <>
          <button
            className="px-4 py-2 rounded bg-slate-900/5 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors text-sm"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className="px-4 py-2 rounded bg-[#165DFF] hover:bg-[#4080FF] active:bg-[#0E42D2] text-white transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || !name.trim() || !effectiveCategoryId}
            onClick={() => void submit()}
            type="button"
          >
            {submitting ? '处理中...' : submitLabel}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col items-center justify-center">
          <DriveUploadImage
            controller={avatarController}
            copy={AVATAR_UPLOAD_COPY}
            service={avatarService}
            shape="circle"
            sizePx={76}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1.5" htmlFor="agent-basic-name">
            智能体名称 <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full bg-slate-50 dark:bg-[#181818] rounded-lg py-2.5 px-3 text-sm text-slate-800 dark:text-gray-200 outline-none"
            id="agent-basic-name"
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：合同审阅助手、数据周报分析师"
            value={name}
          />
        </div>

        <div>
          <span className="block text-sm text-slate-500 dark:text-gray-400 mb-1.5">智能体类型</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`p-3 rounded-lg text-left transition-all flex items-start gap-3 border ${
                !isLocal
                  ? 'bg-[#165DFF]/10 border-[#165DFF]/40'
                  : 'bg-slate-50 dark:bg-[#181818] border-transparent'
              }`}
              onClick={() => setAgentKind('conversation')}
              type="button"
            >
              <Bot className={isLocal ? 'mt-0.5 text-slate-500' : 'mt-0.5 text-[#165DFF]'} size={18} />
              <span>
                <span className="block text-sm font-medium text-slate-800 dark:text-gray-200">对话类智能体</span>
                <span className="mt-0.5 block text-[11px] leading-tight text-slate-500 dark:text-gray-500">
                  在托管运行时中对话，配置提示词、模型与知识库
                </span>
              </span>
            </button>
            <button
              className={`p-3 rounded-lg text-left transition-all flex items-start gap-3 border ${
                isLocal
                  ? 'bg-[#00B42A]/10 border-[#00B42A]/40'
                  : 'bg-slate-50 dark:bg-[#181818] border-transparent'
              }`}
              onClick={() => setAgentKind('local-execution')}
              type="button"
            >
              <Package className={isLocal ? 'mt-0.5 text-[#00B42A]' : 'mt-0.5 text-slate-500'} size={18} />
              <span>
                <span className="block text-sm font-medium text-slate-800 dark:text-gray-200">本地执行智能体</span>
                <span className="mt-0.5 block text-[11px] leading-tight text-slate-500 dark:text-gray-500">
                  上传 zip 安装包，由本地 Harness 运行时驱动
                </span>
              </span>
            </button>
          </div>
        </div>

        {isLocal ? (
          <div>
            <span className="block text-sm text-slate-500 dark:text-gray-400 mb-1.5">本地运行时引擎</span>
            <select
              className="w-full bg-slate-50 dark:bg-[#181818] rounded-lg py-2.5 px-3 text-sm text-slate-800 dark:text-gray-200 outline-none"
              onChange={(event) => setRuntimeEngine(event.target.value)}
              value={runtimeEngine}
            >
              {localEngines.map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.label} — {engine.description}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-gray-500">
              本地智能体统一使用 <code>harness.agent.runtime.v1</code> 运行协议，安装包在下一步上传。
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1.5" htmlFor="agent-basic-category">
              行业分类 <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full bg-slate-50 dark:bg-[#181818] rounded-lg py-2.5 px-3 text-sm text-slate-800 dark:text-gray-200 outline-none"
              id="agent-basic-category"
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              <option value="">请选择行业分类</option>
              {categories.map((parent) => (
                <optgroup key={parent.code} label={parent.label}>
                  {parent.children.map((child) => (
                    <option key={child.code} value={child.code}>
                      {child.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-gray-500">
              分类来自平台的两级行业目录，智能体归入叶子分类，便于按行业检索与治理。
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1.5" htmlFor="agent-basic-description">
            简介
          </label>
          <textarea
            className="w-full bg-slate-50 dark:bg-[#181818] rounded-lg py-2.5 px-3 text-sm text-slate-800 dark:text-gray-200 outline-none h-20 resize-none custom-scrollbar"
            id="agent-basic-description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="一句话描述它能解决什么问题"
            value={description}
          />
        </div>

        {validationError || errorMessage ? (
          <div className="text-[12px] leading-relaxed text-amber-600 dark:text-amber-400 bg-amber-500/5 p-2.5 rounded">
            {validationError || errorMessage}
          </div>
        ) : null}
      </div>
    </ModalWrapper>
  );
}
