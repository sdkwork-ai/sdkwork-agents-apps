import React, { useState, useEffect } from 'react';
import { Folder, Share, MoreHorizontal, Mic, SlidersHorizontal, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@sdkwork/agents-pc-commons';
import { ProjectService, ProjectDetails } from '@sdkwork/agents-pc-chat';

interface ProjectHomeViewProps {
  projectId: string;
}

export const ProjectHomeView: React.FC<ProjectHomeViewProps> = ({ projectId }) => {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);

  useEffect(() => {
    ProjectService.getProjectDetails(projectId).then(setProjectDetails);
  }, [projectId]);

  const projectName = projectDetails?.name ?? '';

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="flex-1 flex justify-center w-full bg-[var(--ag-color-background,#F4F7FC)] overflow-y-auto pt-16">
      <div className="w-full max-w-3xl px-6 flex flex-col items-center">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Folder size={24} className="text-[var(--ag-color-text-secondary,#5B6B88)]" />
            <h1 className="text-2xl font-semibold text-[var(--ag-color-text-primary,#0A1B3D)]">{projectName}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--ag-color-surface-muted,#EAF1FB)] hover:bg-[var(--ag-color-surface-strong,#DCE8F9)] text-[var(--ag-color-text-secondary,#5B6B88)] text-[13px] transition-colors">
              <Share size={14} />
              分享
            </button>
              <button className="p-1.5 rounded-full bg-[var(--ag-color-surface-muted,#EAF1FB)] hover:bg-[var(--ag-color-surface-strong,#DCE8F9)] text-[var(--ag-color-text-secondary,#5B6B88)] transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
          </div>

        {/* Search / Input Box */}
        <div className="w-full max-w-2xl bg-[var(--ag-color-surface,#FFFFFF)] rounded-2xl flex items-center px-4 py-3 mb-6">
          <Plus size={20} className="text-[var(--ag-color-text-secondary,#5B6B88)] mr-3" />
          <input
            type="text"
            placeholder={`${projectName}中的新聊天`}
            className="flex-1 bg-transparent outline-none text-[var(--ag-color-text-primary,#0A1B3D)] text-[15px] placeholder:text-[var(--ag-color-text-tertiary,#8A97AD)]"
          />
          <div className="flex items-center gap-3 ml-2">
            <button className="flex items-center gap-1 text-[13px] text-[var(--ag-color-text-secondary,#5B6B88)] hover:text-[var(--ag-color-text-secondary,#5B6B88)] transition-colors">
              Instant
              <ChevronDown size={14} />
            </button>
              <button className="text-[var(--ag-color-text-secondary,#5B6B88)] hover:text-[var(--ag-color-text-secondary,#5B6B88)] transition-colors">
              <Mic size={18} />
            </button>
              <div className="w-8 h-8 rounded-full bg-[var(--ag-color-primary,#165DFF)] flex items-center justify-center cursor-pointer">
                <SlidersHorizontal size={16} className="text-[var(--ag-color-text-primary,#0A1B3D)]" />
            </div>
            </div>
            </div>

        {/* Tabs */}
        <div className="w-full max-w-2xl flex items-center gap-6 pb-3 mb-4">
          <button className="text-[14px] font-medium text-[var(--ag-color-text-primary,#0A1B3D)] px-3 py-1 bg-[var(--ag-color-surface-strong,#DCE8F9)] rounded-full">
            聊天
          </button>
            <button className="text-[14px] font-medium text-[var(--ag-color-text-tertiary,#8A97AD)] hover:text-[var(--ag-color-text-primary,#0A1B3D)] transition-colors">
            来源
          </button>
        </div>

        {/* Chat List */}
        <div className="w-full max-w-2xl flex flex-col gap-2">
          {!projectDetails ? (
            <div className="text-center text-[var(--ag-color-text-tertiary,#8A97AD)] py-4">加载中...</div>
          ) : (
            projectDetails.chats.map(chat => (
              <button key={chat.id} className="w-full text-left flex justify-between items-start py-4 group hover:bg-[var(--ag-color-surface-muted,#EAF1FB)] rounded-xl px-2 -mx-2 transition-colors">
                <div>
                  <div className="text-[15px] font-medium text-[var(--ag-color-text-primary,#0A1B3D)] mb-1">{chat.title}</div>
                    <div className="text-[13px] text-[var(--ag-color-text-tertiary,#8A97AD)] line-clamp-1">{chat.messages[0]?.text || '无内容'}</div>
                </div>
                  <span className="text-[13px] text-[var(--ag-color-text-tertiary,#8A97AD)] pt-0.5 group-hover:text-[var(--ag-color-text-secondary,#5B6B88)] transition-colors">{formatDate(chat.updatedAt)}</span>
              </button>
            ))
          )}
        </div>
        </div>
        </div>
  );
};
