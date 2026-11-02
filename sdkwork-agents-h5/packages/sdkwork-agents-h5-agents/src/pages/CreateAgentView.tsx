import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, Save, Bot, Brain, Database, Settings2, Sparkles, Edit2, RotateCcw, Copy, Check, Trash2, Mic, Plug, Wand2, MessageSquare, AlertCircle, RefreshCw, ChevronDown, Wrench, Layers, TerminalSquare, Brackets, FileText, PlayCircle } from 'lucide-react';
import { Avatar, IconButton } from '@sdkwork/agents-h5-commons';
import { MessageInput } from '../components/MessageInput';
import { toast } from '../components/Toast';
import { agentService, type AgentConfig } from '../services/AgentService';
import { EditBasicInfoModal } from '../components/EditBasicInfoModal';
import { SelectVoiceModal } from '../components/SelectVoiceModal';
import { SelectModelPopover } from '../components/SelectModelPopover';
import { SelectKnowledgeModal } from '../components/SelectKnowledgeModal';
import { SelectToolsModal, type ToolItem } from '../components/SelectToolsModal';
import { loadRuntimeModelCatalog, type ModelCatalogItem } from '../services/RuntimeCatalogService';
import { SelectSkillsModal, type SkillItem } from '../components/SelectSkillsModal';
import { DEFAULT_AGENT_CONFIG } from '../components/AgentDefaults';
import { createDefaultAvatar } from '../services/DefaultAvatarService';
import { VoiceConfig } from '../services/VoiceService';
import type { KnowledgeBase } from '../services/KnowledgeSelectionService';
import { agentsH5DriveUploadService, createAgentAvatarUploadImageService } from '@sdkwork/agents-h5-core/sdk/driveUploadService';

function mergeCapabilitySnapshots<T extends { id: string }>(
  previous: T[],
  selectedIds: string[],
  snapshots: T[],
): T[] {
  const byId = new Map(previous.map((item) => [item.id, item]));
  for (const item of snapshots) {
    byId.set(item.id, item);
  }
  return selectedIds
    .map((id) => byId.get(id))
    .filter((item): item is T => Boolean(item));
}

interface CreateAgentViewProps {
  onBack: () => void;
  initialAgentId?: string;
}

interface TestMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  extra?: React.ReactNode;
}

const DEFAULT_AGENT_WELCOME_MESSAGE = DEFAULT_AGENT_CONFIG.welcomeMessage;
const DEFAULT_AGENT_SUGGESTED_PROMPTS = DEFAULT_AGENT_CONFIG.suggestedPrompts;
const DEFAULT_AGENT_AVATAR = createDefaultAvatar('agent');
const DEFAULT_TEST_USER_AVATAR = createDefaultAvatar('user');

function createAgentWelcomeTestMessage(content: string): TestMessage {
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

const AccordionSection: React.FC<SectionProps> = ({ title, icon, defaultExpanded = false, children, extra }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="bg-transparent overflow-hidden group transition-all">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3.5 shrink-0 bg-transparent hover:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors relative"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-[var(--color-surface-muted,#EAF1FB)]">
            {icon}
          </div>
          <h3 className="font-medium text-[13px] text-[var(--color-text-primary,#0A1B3D)]">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {extra && <div onClick={e => e.stopPropagation()}>{extra}</div>}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="text-[var(--color-text-secondary,#5B6B88)]">
            <ChevronDown size={14} />
          </motion.div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-[var(--color-surface-muted,#EAF1FB)]"
          >
            <div>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CapabilityBlock: React.FC<{
  title: string;
  icon: ReactNode;
  iconColorClass: string;
  onEdit: () => void;
  items: { id: string; name: string; icon?: ReactNode; desc?: string }[];
  onRemove: (id: string) => void;
  emptyText: string;
}> = ({ title, icon, iconColorClass, onEdit, items, onRemove, emptyText }) => {
  return (
    <AccordionSection
      title={title}
      icon={<span className={iconColorClass}>{icon}</span>}
      defaultExpanded={false}
      extra={
        <div className="flex items-center gap-2">
          {items.length > 0 && <span className="text-[10px] bg-[var(--color-surface-strong,#DCE8F9)] px-1.5 py-0.5 rounded-full text-[var(--color-text-secondary,#5B6B88)] leading-none">{items.length}</span>}
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-[11px] font-medium bg-[var(--color-surface-strong,#DCE8F9)] hover:bg-[var(--color-surface-strong,#DCE8F9)] text-[var(--color-text-primary,#0A1B3D)] px-2.5 py-1 rounded transition-colors relative z-10"
          >
            {items.length > 0 ? '管理' : '添加'}
          </button>
        </div>
      }
    >
      <div className="bg-transparent">
        {items.length > 0 ? (
          <div>
            <AnimatePresence initial={false}>
              {items.map(item => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  key={item.id} 
                  className="flex items-center justify-between p-3 group/item hover:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors overflow-hidden"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconColorClass} bg-[var(--color-surface-strong,#DCE8F9)]  `}>
                      {item.icon || icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-[12px] text-[var(--color-text-primary,#0A1B3D)] truncate font-medium">{item.name}</div>
                      {item.desc && <div className="text-[10px] text-[var(--color-text-secondary,#5B6B88)] truncate mt-0.5">{item.desc}</div>}
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemove(item.id)}
                    title="移除"
                    className="text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-danger,#F53F3F)] opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--color-surface-muted,#EAF1FB)]"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-[12px] text-[var(--color-text-secondary,#5B6B88)] text-center py-3 px-3 leading-relaxed bg-[var(--color-input-bg,#EAF1FB)]">
            {emptyText}
          </div>
        )}
      </div>
    </AccordionSection>
  );
};

export const CreateAgentView: React.FC<CreateAgentViewProps> = ({ onBack, initialAgentId }) => {
  const [prompt, setPrompt] = useState('你是一个专业的代码助手...');
  const [name, setName] = useState('新智能体');
  const [desc, setDesc] = useState('这是一个新创建的智能体');
  const [avatar, setAvatar] = useState('');
  // Short-lived delivery URL for a Drive-backed avatar; `avatar` keeps the
  // durable drive URI that is persisted with the agent config.
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  // Shared Drive image-upload service for the avatar field; built once from
  // the declared `agent.avatar` upload intent (DRIVE_SPEC.md section 18).
  const avatarUploadImageService = React.useMemo(() => createAgentAvatarUploadImageService(), []);
  const [agentType, setAgentType] = useState<AgentConfig['type']>('normal');
  const [model, setModel] = useState(DEFAULT_AGENT_CONFIG.model);
  const [temperature, setTemperature] = useState(DEFAULT_AGENT_CONFIG.temperature);
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(DEFAULT_AGENT_CONFIG.memoryEnabled);
  const [jsonMode, setJsonMode] = useState<boolean>(DEFAULT_AGENT_CONFIG.jsonMode);
  const [debugMode, setDebugMode] = useState<boolean>(DEFAULT_AGENT_CONFIG.debugMode);
  
  const [welcomeMessage, setWelcomeMessage] = useState(DEFAULT_AGENT_WELCOME_MESSAGE);
  const [suggestedPrompts, setSuggestedPrompts] = useState(DEFAULT_AGENT_SUGGESTED_PROMPTS);
  const [showPromptOptimizer, setShowPromptOptimizer] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isModelPopoverOpen, setIsModelPopoverOpen] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const modelTriggerRef = useRef<HTMLDivElement>(null);
  
  const [selectedVoiceIds, setSelectedVoiceIds] = useState<string[]>(DEFAULT_AGENT_CONFIG.voiceIds);
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>(DEFAULT_AGENT_CONFIG.knowledgeBaseIds);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(DEFAULT_AGENT_CONFIG.toolIds);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(DEFAULT_AGENT_CONFIG.skillIds);
  const [draftId, setDraftId] = useState<string | null>(initialAgentId || null);
  
  const [voiceSnapshots, setVoiceSnapshots] = useState<VoiceConfig[]>([]);
  const [kbSnapshots, setKbSnapshots] = useState<KnowledgeBase[]>([]);
  const [toolSnapshots, setToolSnapshots] = useState<ToolItem[]>([]);
  const [skillSnapshots, setSkillSnapshots] = useState<SkillItem[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelCatalogItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchModels = async () => {
      setModelsLoading(true);
      try {
        const models = await loadRuntimeModelCatalog();
        if (cancelled) {
          return;
        }
        setAvailableModels(models);
        if (models.length > 0 && model === DEFAULT_AGENT_CONFIG.model) {
          setModel(models[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load model catalog:', err);
          toast('无法加载模型目录，请稍后重试', 'error');
        }
      } finally {
        if (!cancelled) {
          setModelsLoading(false);
        }
      }
    };
    void fetchModels();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedVoicesData = voiceSnapshots.filter(v => selectedVoiceIds.includes(v.id));
  const selectedKbsData = kbSnapshots.filter(kb => selectedKnowledgeIds.includes(kb.id));
  const selectedToolsData = toolSnapshots.filter(t => selectedToolIds.includes(t.id));
  const selectedSkillsData = skillSnapshots.filter(s => selectedSkillIds.includes(s.id));
  
  const [testMessages, setTestMessages] = useState<TestMessage[]>(() => [
    createAgentWelcomeTestMessage(DEFAULT_AGENT_WELCOME_MESSAGE),
  ]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialAgentId) {
      setName('新智能体');
      setDesc('这是一个新创建的智能体');
      setPrompt('');
      setAvatar('');
      setAgentType('normal');
      setModel(DEFAULT_AGENT_CONFIG.model);
      setTemperature(DEFAULT_AGENT_CONFIG.temperature);
      setMemoryEnabled(DEFAULT_AGENT_CONFIG.memoryEnabled);
      setJsonMode(DEFAULT_AGENT_CONFIG.jsonMode);
      setDebugMode(DEFAULT_AGENT_CONFIG.debugMode);
      setWelcomeMessage(DEFAULT_AGENT_WELCOME_MESSAGE);
      setTestMessages([createAgentWelcomeTestMessage(DEFAULT_AGENT_WELCOME_MESSAGE)]);
      setSuggestedPrompts(DEFAULT_AGENT_SUGGESTED_PROMPTS);
      setSelectedVoiceIds(DEFAULT_AGENT_CONFIG.voiceIds);
      setSelectedKnowledgeIds(DEFAULT_AGENT_CONFIG.knowledgeBaseIds);
      setSelectedToolIds(DEFAULT_AGENT_CONFIG.toolIds);
      setSelectedSkillIds(DEFAULT_AGENT_CONFIG.skillIds);
      setDraftId(null);
      return undefined;
    }

    let cancelled = false;
    setDraftId(null);

    void (async () => {
      try {
        const agent = await agentService.getAgent(initialAgentId);
        if (cancelled) {
          return;
        }
        if (!agent?.id) {
          toast('智能体不存在或无权访问', 'error');
          onBack();
          return;
        }
        setDraftId(agent.id);
        setName(agent.name);
        setDesc(agent.description || '');
        setPrompt(agent.systemPrompt ?? '');
        setAvatar(agent.avatar || '');
        setAvatarPreviewUrl('');
        const persistedAvatar = agent.avatar ?? '';
        if (persistedAvatar.startsWith('drive://')) {
          agentsH5DriveUploadService.resolvePreviewUrl(persistedAvatar)
            .then((url) => setAvatarPreviewUrl(url))
            .catch(() => {
              // A node the caller cannot read stays on the default avatar.
            });
        }
        setAgentType(agent.type);
        setModel(agent.model || DEFAULT_AGENT_CONFIG.model);
        setTemperature(agent.temperature ?? DEFAULT_AGENT_CONFIG.temperature);
        setMemoryEnabled(agent.memoryEnabled ?? DEFAULT_AGENT_CONFIG.memoryEnabled);
        setJsonMode(agent.jsonMode ?? DEFAULT_AGENT_CONFIG.jsonMode);
        setDebugMode(agent.debugMode ?? DEFAULT_AGENT_CONFIG.debugMode);
        setSuggestedPrompts(agent.suggestedPrompts ?? DEFAULT_AGENT_SUGGESTED_PROMPTS);
        setSelectedVoiceIds(agent.voiceIds ?? DEFAULT_AGENT_CONFIG.voiceIds);
        setSelectedKnowledgeIds(agent.knowledgeBaseIds ?? DEFAULT_AGENT_CONFIG.knowledgeBaseIds);
        setSelectedToolIds(agent.toolIds ?? DEFAULT_AGENT_CONFIG.toolIds);
        setSelectedSkillIds(agent.skillIds ?? DEFAULT_AGENT_CONFIG.skillIds);
        const nextWelcomeMessage = agent.welcomeMessage ?? DEFAULT_AGENT_WELCOME_MESSAGE;
        setWelcomeMessage(nextWelcomeMessage);
        setTestMessages([createAgentWelcomeTestMessage(nextWelcomeMessage)]);
      } catch {
        if (cancelled) {
          return;
        }
        toast('加载智能体失败，请稍后重试', 'error');
        onBack?.();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialAgentId, onBack]);

  const resolveAgentDisplayAvatar = () => avatarPreviewUrl || avatar || DEFAULT_AGENT_AVATAR;

  const buildCurrentAgentConfig = (agentId?: string): AgentConfig => ({
    ...(agentId ? { id: agentId } : {}),
    name,
    description: desc,
    ...(avatar ? { avatar } : {}),
    type: agentType,
    systemPrompt: prompt,
    knowledgeBaseIds: selectedKnowledgeIds,
    welcomeMessage,
    debugMode,
    jsonMode,
    memoryEnabled,
    model,
    temperature,
    suggestedPrompts,
    voiceIds: selectedVoiceIds,
    toolIds: selectedToolIds,
    skillIds: selectedSkillIds,
  });

  const resolveMutableAgentId = (): string | undefined => {
    if (draftId) {
      return draftId;
    }
    if (initialAgentId) {
      throw new Error('Editable agent is not owned by the current user');
    }
    return undefined;
  };

  const persistCurrentAgentConfig = async (agentId?: string): Promise<AgentConfig> => {
    const config = buildCurrentAgentConfig(agentId);
    if (agentId) {
      const updatedAgent = await agentService.updateAgent(agentId, config);
      return {
        ...config,
        ...updatedAgent,
        id: updatedAgent.id ?? agentId,
      };
    }

    const createdAgent = await agentService.createAgent(config);
    if (!createdAgent.id) {
      throw new Error('Created agent id is required');
    }
    setDraftId(createdAgent.id);
    return {
      ...config,
      ...createdAgent,
      id: createdAgent.id,
    };
  };

  const ensurePersistedAgentForRuntime = async (): Promise<AgentConfig> => {
    return persistCurrentAgentConfig(resolveMutableAgentId());
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const savedAgent = await persistCurrentAgentConfig(resolveMutableAgentId());
      if (savedAgent.id) {
        setDraftId(savedAgent.id);
      }
      toast('草稿已保存', 'success');
    } catch (error) {
      toast('保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!name.trim()) {
      toast('请输入智能体名称', 'error');
      return;
    }
    setPublishing(true);
    try {
      const savedAgent = await persistCurrentAgentConfig(resolveMutableAgentId());
      if (!savedAgent.id) {
        throw new Error('Created agent id is required');
      }
      setDraftId(savedAgent.id);
      await agentService.publishAgent(savedAgent.id);
      toast('智能体发布成功', 'success');
      onBack(); // navigate back after publishing
    } catch (error) {
      toast('发布失败', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [testMessages, isTyping]);

  const handleTestSend = async (
    content: string,
    type?: 'text' | 'image' | 'file' | 'voice' | 'video',
    extraInfo?: { file?: File },
  ) => {
    // The preview-turn API accepts text only (no Drive attachment refs), so a
    // picked file is refused instead of silently sending a local blob URL.
    if (extraInfo?.file || (type && type !== 'text')) {
      toast('预览会话暂不支持文件附件，请在正式会话中发送', 'error');
      return;
    }
    if (!content.trim() || isTyping) return;
    
    const newMsg: TestMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: content,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    setTestMessages(prev => [...prev, newMsg]);
    setIsTyping(true);

    try {
      const preview = await agentService.requestPreviewResponse({
        config: await ensurePersistedAgentForRuntime(),
        content,
        debugMode,
        memoryEnabled,
        model,
        temperature,
      });
      setTestMessages(prev => [...prev, {
        id: preview.executionId,
        role: 'assistant',
        content: preview.content,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    } catch (error) {
      toast('预览失败：后端未返回有效结果', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRestartTest = () => {
    setTestMessages([createAgentWelcomeTestMessage(welcomeMessage)]);
    setIsTyping(false);
  };

  const handleOptimizePrompt = async () => {
    setShowPromptOptimizer(true);
    try {
      const result = await agentService.optimizePrompt({
        config: await ensurePersistedAgentForRuntime(),
        prompt,
      });
      setPrompt(result.optimizedPrompt);
      toast('提示词已智能优化', 'success');
    } catch (error) {
      toast('提示词优化失败：后端未返回有效结果', 'error');
    } finally {
      setShowPromptOptimizer(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 min-w-0 min-h-0 bg-[var(--color-surface-color,#FFFFFF)] text-[var(--color-text-primary,#0A1B3D)]"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 shrink-0 bg-[var(--color-surface-color,#FFFFFF)]">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-text-primary,#0A1B3D)] transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">返回</span>
        </button>
        
        <div className="flex items-center gap-3">
          <button 
            className="px-4 py-1.5 rounded text-sm text-[var(--color-text-primary,#0A1B3D)] hover:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors disabled:opacity-50" 
            onClick={handleSaveDraft}
            disabled={saving || publishing}
          >
            {saving ? '保存中...' : '保存草稿'}
          </button>
          <button 
            className="px-4 py-1.5 rounded text-sm bg-[var(--color-success,#00B42A)] hover:bg-[var(--color-success,#00B42A)] text-white transition-colors flex items-center gap-1.5 disabled:opacity-50" 
            onClick={handlePublish}
            disabled={saving || publishing}
          >
            <Save size={14} />
            {publishing ? '发布中...' : '发布智能体'}
          </button>
        </div>
      </div>

      {/* 3-Column Layout (1.5 : 1.5 : 2) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Column 1: System Prompt (Left - 1.5/5 = 30%) */}
        <div className="w-[30%] shrink-0 flex flex-col min-h-0 bg-[var(--color-surface-color,#FFFFFF)]">
          {/* Persona / System Prompt */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-4 flex items-center justify-between bg-[var(--color-surface-color,#FFFFFF)]/50 sticky top-0">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-[var(--color-icon-active,#165DFF)]" />
                <h3 className="font-medium text-sm text-[var(--color-text-primary,#0A1B3D)]">人设与回复逻辑</h3>
              </div>
              <button 
                onClick={handleOptimizePrompt}
                disabled={showPromptOptimizer || !prompt.trim()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--color-primary-subtle,#E8F0FF)] text-[var(--color-primary,#165DFF)] hover:bg-[var(--color-primary-subtle,#E8F0FF)] transition-colors text-xs font-medium disabled:opacity-50"
              >
                {showPromptOptimizer ? <RefreshCw size={12} className="animate-spin" /> : <Wand2 size={12} />}
                AI 优化
              </button>
            </div>
            <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="h-9 flex items-center gap-3 px-3 bg-[var(--color-input-bg,#EAF1FB)]">
                 <button className="text-[11px] text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-text-primary,#0A1B3D)] flex items-center gap-1 px-1.5 py-1 rounded hover:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors"><TerminalSquare size={12}/>变量 ( {'{{var}}'} )</button>
                 <button className="text-[11px] text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-text-primary,#0A1B3D)] flex items-center gap-1 px-1.5 py-1 rounded hover:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors"><Brackets size={12}/>常用片段</button>
                 <button className="text-[11px] text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-text-primary,#0A1B3D)] flex items-center gap-1 px-1.5 py-1 rounded hover:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors"><FileText size={12}/>模版库</button>
              </div>
              <textarea 
                placeholder="在此定义智能体的角色背景、技能组、工作流及约束条件。优秀的提示词是智能体灵魂..." 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="flex-1 w-full bg-[var(--color-input-bg,#EAF1FB)] text-[13px] text-[var(--color-text-primary,#0A1B3D)] outline-none focus:bg-[var(--color-input-bg,#EAF1FB)] resize-none custom-scrollbar transition-all leading-loose p-4"
              />
              <div className="py-2 px-4 text-[11px] text-[var(--color-text-secondary,#5B6B88)] flex justify-between bg-[var(--color-input-bg,#EAF1FB)]">
                <span>Shift + Enter 换行</span>
                <span>{prompt.length} 字符</span>
              </div>
            </div>
          </div>


        </div>

        {/* Column 2: Configuration (Middle - 1.5/5 = 30%) */}
        <div className="w-[30%] shrink-0 overflow-y-auto custom-scrollbar bg-[var(--color-input-bg,#EAF1FB)]">
          <div className="flex flex-col">
            
            {/* Basic Info */}
            <div className="bg-transparent p-4 flex gap-3 items-center cursor-pointer hover:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors" onClick={() => setIsEditModalOpen(true)}>
              <Avatar src={resolveAgentDisplayAvatar()} alt={name} className="w-12 h-12 rounded-lg bg-[var(--color-input-bg,#EAF1FB)] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[15px] font-semibold text-[var(--color-text-primary,#0A1B3D)] truncate pr-4">{name}</div>
                  <button className="text-[11px] text-[var(--color-primary,#165DFF)] font-medium bg-[var(--color-primary-subtle,#E8F0FF)] px-2 py-0.5 rounded transition-opacity">编辑</button>
                </div>
                <div className="text-[12px] text-[var(--color-text-secondary,#5B6B88)] line-clamp-2 leading-relaxed">{desc}</div>
              </div>
            </div>

            {/* Model & Strategy */}
            <AccordionSection 
              title="模型与策略" 
              icon={<span className="text-[var(--color-primary,#165DFF)]"><Brain size={13} /></span>}
              defaultExpanded={true}
            >
              <div className="space-y-4 p-4 bg-transparent">
                <div 
                  ref={modelTriggerRef}
                  onClick={() => setIsModelPopoverOpen(true)}
                  className="bg-[var(--color-input-bg,#EAF1FB)] rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[var(--color-primary-subtle,#E8F0FF)] text-[var(--color-primary,#165DFF)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Brain size={13} />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[var(--color-text-primary,#0A1B3D)] leading-none mb-1">{model}</div>
                      <div className="text-[10px] text-[var(--color-text-secondary,#5B6B88)] leading-none">点击切换模型引擎</div>
                    </div>
                  </div>
                  <div className="text-[11px] bg-[var(--color-surface-muted,#EAF1FB)] px-2 py-0.5 rounded text-[var(--color-primary,#165DFF)] font-medium">更改</div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-medium mb-2">
                    <span className="text-[var(--color-text-secondary,#5B6B88)]">温度 (Temperature)</span>
                    <span className="text-[var(--color-primary,#165DFF)] bg-[var(--color-primary-subtle,#E8F0FF)] px-1.5 rounded">{temperature}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="2" step="0.1"
                    value={temperature}
                    onChange={e => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--color-text-secondary,#5B6B88)] mt-1">
                    <span>确定性、严谨</span>
                    <span>创造性、发散</span>
                  </div>
                </div>
              </div>
            </AccordionSection>

            {/* Memory & Context */}
            <AccordionSection 
              title="记忆与上下文" 
              icon={<span className="text-[var(--color-primary,#165DFF)]"><Database size={13} /></span>}
              defaultExpanded={true}
            >
              <div className="bg-transparent">
                <div className="p-4 flex items-center justify-between hover:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors">
                  <div>
                    <div className="text-[13px] font-medium text-[var(--color-text-primary,#0A1B3D)] mb-0.5">连续性长记忆</div>
                    <div className="text-[11px] text-[var(--color-text-secondary,#5B6B88)] max-w-[280px] leading-relaxed">自动提取并持久化用户习惯、偏好和事实经验。</div>
                  </div>
                  <button 
                    onClick={() => setMemoryEnabled(!memoryEnabled)}
                    className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${memoryEnabled ? 'bg-[var(--color-primary,#165DFF)]' : 'bg-[var(--color-surface-strong,#DCE8F9)]  '}`}
                  >
                    <motion.div 
                      layout
                      className="w-3.5 h-3.5 bg-white rounded-full absolute top-[2px]"
                      initial={false}
                      animate={{ left: memoryEnabled ? '18px' : '3px' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
                
                <AnimatePresence>
                  {memoryEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-[var(--color-input-bg,#EAF1FB)]"
                    >
                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-[var(--color-text-secondary,#5B6B88)]">记忆变量提取</span>
                          <span className="text-[10px] text-[var(--color-primary,#165DFF)] bg-[var(--color-primary-subtle,#E8F0FF)] px-2 py-1 rounded cursor-pointer hover:bg-[var(--color-primary-subtle,#E8F0FF)] transition-colors">查看数据库</span>
                        </div>
                        <div className="text-[11px] text-[var(--color-text-secondary,#5B6B88)] leading-relaxed bg-[var(--color-primary-subtle,#E8F0FF)] p-2 rounded">
                          <span className="text-[var(--color-primary,#165DFF)] mr-1">TIPS:</span> 启用后，智能体将使用专属向量空间存储相关话题和碎片知识，减少上下文窗口浪费。
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AccordionSection>

            {/* Capabilities Expansion -> Separate Blocks */}
            
            <CapabilityBlock
              title="发音人配置"
              icon={<Mic size={14} />}
              iconColorClass="text-[var(--color-warning,#FF7D00)]"
              onEdit={() => setIsVoiceModalOpen(true)}
              items={selectedVoicesData.map(v => ({ id: v.id, name: v.name, desc: v.description }))}
              onRemove={id => setSelectedVoiceIds(prev => prev.filter(x => x !== id))}
              emptyText="暂未配置发音人，智能体将无法使用语音交互。"
            />

            <CapabilityBlock
              title="关联知识库"
              icon={<Database size={14} />}
              iconColorClass="text-[var(--color-primary,#165DFF)]"
              onEdit={() => setIsKnowledgeModalOpen(true)}
              items={selectedKbsData.map(k => ({ id: k.id, name: k.name, desc: k.description }))}
              onRemove={id => setSelectedKnowledgeIds(prev => prev.filter(x => x !== id))}
              emptyText="暂无私有数据挂载。配置知识库可提供垂直领域经验。"
            />

            {/* Extended Capabilities: Plugins & Skills */}
            <AccordionSection
              title="扩展能力 (Plugins & Skills)"
              icon={<span className="text-[var(--color-success,#00B42A)]"><Wrench size={13} /></span>}
              defaultExpanded={false}
              extra={
                <div className="flex items-center gap-2">
                  {(selectedToolIds.length + selectedSkillIds.length) > 0 && <span className="text-[10px] bg-[var(--color-surface-strong,#DCE8F9)] px-1.5 py-0.5 rounded-full text-[var(--color-text-secondary,#5B6B88)] leading-none">{selectedToolIds.length + selectedSkillIds.length}</span>}
                </div>
              }
            >
              <div className="bg-transparent flex flex-col pt-0">
                
                {/* Tools & MCP Group */}
                <div>
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <Wrench size={12} className="text-[var(--color-icon-success,#00B42A)]" />
                      <span className="text-[12px] font-medium text-[var(--color-text-primary,#0A1B3D)]">工具库与 MCP</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsToolsModalOpen(true); }}
                      className="text-[10px] font-medium bg-[var(--color-surface-strong,#DCE8F9)] hover:bg-[var(--color-surface-strong,#DCE8F9)] text-[var(--color-text-primary,#0A1B3D)] px-2 py-0.5 rounded transition-colors"
                    >
                      + 添加
                    </button>
                  </div>
                  {selectedToolsData.length > 0 ? (
                    <div className="px-2 pb-2">
                      <AnimatePresence initial={false}>
                        {selectedToolsData.map(item => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            key={item.id} 
                            className="flex items-center justify-between p-2 rounded-lg group/item hover:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors overflow-hidden"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[var(--color-success,#00B42A)] bg-[var(--color-surface-strong,#DCE8F9)]">
                                {item.icon || <Wrench size={12} />}
                              </div>
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="text-[12px] text-[var(--color-text-primary,#0A1B3D)] truncate font-medium">{item.name}</div>
                                {item.description && <div className="text-[10px] text-[var(--color-text-secondary,#5B6B88)] truncate mt-0.5">{item.description}</div>}
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedToolIds(prev => prev.filter(x => x !== item.id))}
                              title="移除"
                              className="text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-danger,#F53F3F)] opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--color-surface-muted,#EAF1FB)]"
                            >
                              <X size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[var(--color-text-secondary,#5B6B88)] text-center py-3 px-4 mx-2 mb-3 bg-[var(--color-input-bg,#EAF1FB)] rounded-lg">
                      未启用外部交互能力
                    </div>
                  )}
                </div>

                {/* Agent Skills Group */}
                <div>
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <Layers size={12} className="text-[var(--color-icon-active,#165DFF)]" />
                      <span className="text-[12px] font-medium text-[var(--color-text-primary,#0A1B3D)]">Agent Skills</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsSkillsModalOpen(true); }}
                      className="text-[10px] font-medium bg-[var(--color-surface-strong,#DCE8F9)] hover:bg-[var(--color-surface-strong,#DCE8F9)] text-[var(--color-text-primary,#0A1B3D)] px-2 py-0.5 rounded transition-colors"
                    >
                      + 添加
                    </button>
                  </div>
                  {selectedSkillsData.length > 0 ? (
                    <div className="px-2 pb-2">
                      <AnimatePresence initial={false}>
                        {selectedSkillsData.map(item => (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            key={item.id} 
                            className="flex items-center justify-between p-2 rounded-lg group/item hover:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors overflow-hidden"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[var(--color-primary,#165DFF)] bg-[var(--color-surface-strong,#DCE8F9)]">
                                {item.icon || <Layers size={12} />}
                              </div>
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="text-[12px] text-[var(--color-text-primary,#0A1B3D)] truncate font-medium">{item.name}</div>
                                {item.description && <div className="text-[10px] text-[var(--color-text-secondary,#5B6B88)] truncate mt-0.5">{item.description}</div>}
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedSkillIds(prev => prev.filter(x => x !== item.id))}
                              title="移除"
                              className="text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-danger,#F53F3F)] opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--color-surface-muted,#EAF1FB)]"
                            >
                              <X size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[var(--color-text-secondary,#5B6B88)] text-center py-3 px-4 mx-2 mb-3 bg-[var(--color-input-bg,#EAF1FB)] rounded-lg">
                      未配置高级心智流或预设技能
                    </div>
                  )}
                </div>

              </div>
            </AccordionSection>

            {/* Advanced Settings */}
            <AccordionSection 
              title="高级配置" 
              icon={<span className="text-[var(--color-text-secondary,#5B6B88)]"><AlertCircle size={13} /></span>}
              defaultExpanded={false}
            >
              <div className="bg-transparent">
                <div className="p-4 flex items-center justify-between hover:bg-[var(--color-surface-muted,#EAF1FB)] transition-colors">
                  <div>
                    <div className="text-[13px] font-medium text-[var(--color-text-primary,#0A1B3D)] mb-0.5">严格 JSON 输出</div>
                    <div className="text-[11px] text-[var(--color-text-secondary,#5B6B88)] max-w-[200px]">强制化模型回复格式。</div>
                  </div>
                  <button 
                    onClick={() => setJsonMode(!jsonMode)}
                    className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ml-4   ${jsonMode ? 'bg-[var(--color-warning,#FF7D00)]' : 'bg-[var(--color-surface-strong,#DCE8F9)]'}`}
                  >
                    <motion.div 
                      layout
                      className="w-3.5 h-3.5 bg-white rounded-full absolute top-[2px]"
                      initial={false}
                      animate={{ left: jsonMode ? '18px' : '3px' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
            </AccordionSection>

            {/* Conversation Experience */}
            <AccordionSection 
              title="对话体验配置" 
              icon={<span className="text-[var(--color-primary,#165DFF)]"><MessageSquare size={13} /></span>}
              defaultExpanded={true}
            >
              <div className="p-4 space-y-4 bg-transparent">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-secondary,#5B6B88)] mb-1.5">开场白 (Welcome Message)</label>
                  <textarea 
                    value={welcomeMessage}
                    onChange={e => setWelcomeMessage(e.target.value)}
                    className="w-full bg-[var(--color-input-bg,#EAF1FB)] rounded-lg p-2.5 text-[12px] text-[var(--color-text-primary,#0A1B3D)] outline-none resize-none h-20 transition-all custom-scrollbar"
                    placeholder="请输入智能体初次见面的自我介绍..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-secondary,#5B6B88)] mb-1.5">预设快捷提问 (Starter Prompts)</label>
                  <div className="space-y-1.5">
                    {suggestedPrompts.map((p, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input 
                          value={p}
                          onChange={e => {
                            const newP = [...suggestedPrompts];
                            newP[i] = e.target.value;
                            setSuggestedPrompts(newP);
                          }}
                          className="flex-1 bg-[var(--color-input-bg,#EAF1FB)] rounded-md px-2.5 py-1.5 text-[12px] text-[var(--color-text-primary,#0A1B3D)] outline-none transition-all h-8"
                          placeholder="例如：如何使用这个功能？"
                        />
                        <button 
                          onClick={() => setSuggestedPrompts(prev => prev.filter((_, idx) => idx !== i))}
                          className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-danger,#F53F3F)] transition-colors bg-[var(--color-input-bg,#EAF1FB)] rounded-md"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setSuggestedPrompts(prev => [...prev, ''])}
                      className="w-full py-1.5 rounded-md text-[11px] text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-text-primary,#0A1B3D)] transition-all bg-[var(--color-input-bg,#EAF1FB)]/50 hover:bg-[var(--color-input-bg,#EAF1FB)]"
                    >
                      + 添加一条快捷问题
                    </button>
                  </div>
                </div>
              </div>
            </AccordionSection>

          </div>
        </div>

        {/* Column 3: Test Chat (Right - 2/5 = 40%) */}
        <div className="w-[40%] shrink-0 flex flex-col min-h-0 bg-[var(--color-surface-color,#FFFFFF)] relative">
          {/* Test Chat Header */}
          <div className="h-14 flex items-center justify-between px-5 shrink-0 bg-[var(--color-surface-color,#FFFFFF)]">
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-medium text-[var(--color-text-primary,#0A1B3D)] flex items-center gap-2"><PlayCircle size={16} className="text-[var(--color-icon-success,#00B42A)]"/>预览与调试</span>
              {isTyping && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--color-success-bg,#E8FFEF)] text-[var(--color-success,#00B42A)] text-[11px]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success,#00B42A)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-success,#00B42A)]"></span>
                  </span>
                  思考中
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary,#5B6B88)] cursor-pointer hover:text-[var(--color-text-primary,#0A1B3D)]">
                <input type="checkbox" checked={debugMode} onChange={e => setDebugMode(e.target.checked)} className="accent-blue-500 w-3 h-3" />
                显示思考过程
              </label>
              <div className="w-px h-3 bg-[var(--color-surface-strong,#DCE8F9)]"></div>
              <button 
                onClick={handleRestartTest}
                className="text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-danger,#F53F3F)] transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="清空记录并重置"
              >
                <Trash2 size={14} />
                清空
              </button>
            </div>
          </div>
          
          {/* Test Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-[var(--color-surface-color,#FFFFFF)]">
            {testMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-secondary,#5B6B88)] space-y-4">
                <Bot size={48} className="text-[var(--color-icon-default,#5B6B88)] opacity-50" />
                <p className="text-sm">对话已清空，发送消息开始测试</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {testMessages.map(msg => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar 
                      src={msg.role === 'user' ? DEFAULT_TEST_USER_AVATAR : resolveAgentDisplayAvatar()}
                      alt={msg.role} 
                      className="w-9 h-9 rounded-lg shrink-0 mt-1 bg-[var(--color-input-bg,#EAF1FB)]" 
                    />
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className="text-[12px] font-medium text-[var(--color-text-secondary,#5B6B88)]">
                          {msg.role === 'user' ? '你' : name}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-secondary,#5B6B88)]">{msg.time}</span>
                      </div>
                      
                      <div className="relative group/bubble">
                        <div className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user' 
                            ? 'bg-[var(--color-success,#00B42A)] text-white rounded-tr-sm ' 
                            : 'bg-[var(--color-input-bg,#EAF1FB)] text-[var(--color-text-primary,#0A1B3D)] rounded-tl-sm   '
                        }`}>
                          {msg.content}
                        </div>
                        
                        {/* Hover Actions */}
                        {msg.role === 'assistant' && (
                          <div className="absolute -right-10 top-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex flex-col gap-1">
                            <button 
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="p-1.5 rounded-md text-[var(--color-text-secondary,#5B6B88)] hover:text-[var(--color-text-primary,#0A1B3D)] hover:bg-[var(--color-surface-strong,#DCE8F9)] transition-colors"
                              title="复制"
                            >
                              {copiedId === msg.id ? <Check size={14} className="text-[var(--color-icon-success,#00B42A)]" /> : <Copy size={14} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <Avatar 
                  src={resolveAgentDisplayAvatar()}
                  alt="assistant" 
                  className="w-9 h-9 rounded-lg shrink-0 mt-1 bg-[var(--color-input-bg,#EAF1FB)]" 
                />
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-[12px] font-medium text-[var(--color-text-secondary,#5B6B88)]">{name}</span>
                  </div>
                  <div className="bg-[var(--color-input-bg,#EAF1FB)] rounded-2xl rounded-tl-sm px-4 py-3.5">
                    <div className="flex gap-1 items-center h-2">
                      <motion.div className="w-1.5 h-1.5 bg-[var(--color-surface-strong,#DCE8F9)] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 bg-[var(--color-surface-strong,#DCE8F9)] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 bg-[var(--color-surface-strong,#DCE8F9)] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Test Chat Input */}
          <div className="bg-[var(--color-surface-color,#FFFFFF)]">
            {suggestedPrompts.length > 0 && testMessages.length <= 1 && (
              <div className="px-5 pb-2 pt-1 flex gap-2 flex-wrap min-h-[36px]">
                {suggestedPrompts.filter(p => p).map((p, i) => (
                  <button 
                    key={i}
                    onClick={() => handleTestSend(p)}
                    className="px-3 py-1.5 rounded-full bg-[var(--color-primary-subtle,#E8F0FF)] text-[var(--color-primary,#165DFF)] hover:bg-[var(--color-primary-subtle,#E8F0FF)] text-xs transition-colors shrink-0 whitespace-nowrap"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <MessageInput 
              onSend={handleTestSend}
              isTyping={isTyping}
              onStop={() => setIsTyping(false)}
              placeholder="发送测试消息..."
              defaultHeight={110}
              resizable={false}
              showAdvancedActions
            />
          </div>
        </div>

      </div>

      <EditBasicInfoModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialName={name}
        initialDesc={desc}
        initialAvatar={avatar}
        avatarService={avatarUploadImageService}
        avatarAppResourceId={() => draftId ?? undefined}
        onEnsureAvatarAnchor={async () => {
          const persisted = await ensurePersistedAgentForRuntime();
          return persisted.id ?? null;
        }}
        onSave={(newName, newDesc, newAvatar) => {
           setName(newName);
           setDesc(newDesc);
           // The Drive URI is the durable identity; the short-lived delivery
           // URL stays display-only.
           if (newAvatar) {
             setAvatar(newAvatar);
             setAvatarPreviewUrl('');
             if (newAvatar.startsWith('drive://')) {
               agentsH5DriveUploadService.resolvePreviewUrl(newAvatar)
                 .then((url) => setAvatarPreviewUrl(url))
                 .catch(() => {
                   // A node the caller cannot read stays on the default avatar.
                 });
             }
           }
           setIsEditModalOpen(false);
           toast('基础信息已更新', 'success');
        }}
      />
      <SelectVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        selectedVoices={selectedVoiceIds}
        isMulti={false}
        onSave={(ids, items) => {
          setSelectedVoiceIds(ids);
          setVoiceSnapshots((prev) => mergeCapabilitySnapshots(prev, ids, items));
          toast(`配置成功：已关联 ${ids.length} 个发音人`, 'success');
        }}
      />
      <SelectModelPopover
        isOpen={isModelPopoverOpen}
        onClose={() => setIsModelPopoverOpen(false)}
        triggerElement={modelTriggerRef.current}
        selectedModelId={model}
        models={availableModels}
        loading={modelsLoading}
        onSave={(modelId) => {
          setModel(modelId);
          toast(`已切换模型引擎`, 'success');
        }}
      />
      <SelectKnowledgeModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
        selectedKbIds={selectedKnowledgeIds}
        onSave={(ids, items) => {
          setSelectedKnowledgeIds(ids);
          setKbSnapshots((prev) => mergeCapabilitySnapshots(prev, ids, items));
          toast(`已挂载 ${ids.length} 个知识库`, 'success');
        }}
      />
      <SelectToolsModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        selectedToolIds={selectedToolIds}
        onSave={(ids, items) => {
          setSelectedToolIds(ids);
          setToolSnapshots((prev) => mergeCapabilitySnapshots(prev, ids, items));
          toast(`已启用 ${ids.length} 个环境与 MCP 能力`, 'success');
        }}
      />
      <SelectSkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        selectedSkillIds={selectedSkillIds}
        onSave={(ids, items) => {
          setSelectedSkillIds(ids);
          setSkillSnapshots((prev) => mergeCapabilitySnapshots(prev, ids, items));
          toast(`已注入 ${ids.length} 项高级心智流`, 'success');
        }}
      />
    </motion.div>
  );
};
