import React, { useState } from 'react';
import { X, Clock, Calendar, ChevronDown, Award, ThumbsUp, Play } from 'lucide-react';
import type { Activity, ActivityWork } from '../types';
import { cn } from '@sdkwork/agents-pc-commons';

interface ActivityDetailViewProps {
  activity: Activity;
  onClose: () => void;
  onPlayVideo: (work: ActivityWork) => void;
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({ activity, onClose, onPlayVideo }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'全部' | '获奖作品'>('全部');
  const [sortBy, setSortBy] = useState<'time' | 'likes'>('likes');

    // Sort works
  const sortedWorks = [...activity.works].sort((a, b) => {
    if (sortBy === 'likes') return b.likes - a.likes;
    return b.id.localeCompare(a.id); // Dummy time sort
  });

    // Filter works (for dummy purposes, award tab only shows top ones)
  const filteredWorks = activeSubTab === '获奖作品'
    ? sortedWorks.filter(w => w.likes > 50)
  : sortedWorks;

  return (
    <div className="w-full min-h-screen bg-[var(--ag-color-background,#F4F7FC)] text-[var(--ag-color-text-primary,#0A1B3D)] animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Top Banner and Navigation Bar */}
      <div className="max-w-[1200px] mx-auto px-6 py-8 relative">
        {/* Close button inside page context */}
        <button
          onClick={onClose}
          className="absolute top-8 right-6 p-2 bg-[var(--ag-color-surface-muted,#EAF1FB)] text-[var(--ag-color-icon-default,#5B6B88)] hover:bg-[var(--ag-color-surface-strong,#DCE8F9)] hover:text-[var(--ag-color-icon-strong,#0A1B3D)] rounded-full transition-colors"
          title="返回列表"
        >
          <X size={20} />
        </button>

        {/* Header Metadata */}
        <div className="mb-6 max-w-[85%]">
          <h1 className="text-[24px] font-bold tracking-tight text-[var(--ag-color-text-primary,#0A1B3D)] mb-4">
            {activity.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--ag-color-text-secondary,#5B6B88)]">
            <span className="flex items-center gap-1.5 bg-[var(--ag-color-primary-subtle,#E8F0FF)] text-[var(--ag-color-warning,#FF7D00)] px-2.5 py-1 rounded-md font-medium">
              <Clock size={12} />
              {activity.status}
            </span>
            <span className="flex items-center gap-1.5 text-[var(--ag-color-text-primary,#0A1B3D)]">
              <Calendar size={12} className="text-[var(--ag-color-icon-default,#5B6B88)]" />
              活动时间: {activity.timeRange}
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3 mb-8">
          <button className="px-5 py-2 rounded-xl bg-[var(--ag-color-primary,#165DFF)] text-white hover:bg-[var(--ag-color-primary-hover,#4080FF)] text-[13px] font-semibold transition-colors">
            去创作
          </button>
          <button className="px-5 py-2 rounded-xl bg-[var(--ag-color-surface,#FFFFFF)] text-[var(--ag-color-text-primary,#0A1B3D)] hover:bg-[var(--ag-color-surface-muted,#EAF1FB)] text-[13px] font-semibold transition-colors">
            立即投稿
          </button>
        </div>

        {/* Big Beautiful Cover Banner */}
        <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden mb-8 relative bg-[var(--ag-color-surface-strong,#DCE8F9)]">
          <img
            src={activity.banner}
            alt={activity.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[var(--ag-color-scrim,rgba(10,27,61,0.45))]" />
        </div>

        {/* Two-column Layout: Content Left, Side Timeline Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Background Section */}
            <div className="bg-[var(--ag-color-surface,#FFFFFF)] rounded-2xl p-6">
              <h2 className="text-[15px] font-bold text-[var(--ag-color-text-primary,#0A1B3D)] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[var(--ag-color-primary,#165DFF)] rounded-full"></span>
                  活动背景
              </h2>
              <div className={cn(
                "text-[13px] text-[var(--ag-color-text-secondary,#5B6B88)] leading-relaxed whitespace-pre-line transition-all duration-300",
                !isExpanded ? "line-clamp-4" : ""
              )}>
                {activity.background}
              </div>
              <div className="mt-4 flex justify-center pt-3">
                <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[var(--ag-color-text-tertiary,#8A97AD)] hover:text-[var(--ag-color-text-primary,#0A1B3D)] text-[12px] font-medium transition-colors flex items-center gap-1"
              >
                  {isExpanded ? '收起' : '展开'}
                  <ChevronDown size={14} className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
                </button>
              </div>
            </div>

            {/* Submitted Works Header & Grid */}
            <div>
              <div className="flex items-center justify-between pb-4 mb-6">
                <div className="flex items-center gap-1 bg-[var(--ag-color-surface-muted,#EAF1FB)] p-1 rounded-lg">
                  {(['全部', '获奖作品'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab)}
                        className={cn(
                        "px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                        activeSubTab === tab
                          ? "bg-[var(--ag-color-surface,#FFFFFF)] text-[var(--ag-color-primary,#165DFF)]"
                          : "text-[var(--ag-color-text-secondary,#5B6B88)] hover:text-[var(--ag-color-text-primary,#0A1B3D)]"
                      )}
                      >
                        {tab}
                      </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs text-[var(--ag-color-text-secondary,#5B6B88)]">
                  <button
                    onClick={() => setSortBy('time')}
                    className={cn("hover:text-[var(--ag-color-primary,#165DFF)] transition-colors", sortBy === 'time' ? "text-[var(--ag-color-primary,#165DFF)] font-semibold" : "")}
                  >
                    按时间
                  </button>
                  <span className="text-[var(--ag-color-surface-strong,#DCE8F9)]">|</span>
                  <button
                    onClick={() => setSortBy('likes')}
                    className={cn("hover:text-[var(--ag-color-primary,#165DFF)] transition-colors", sortBy === 'likes' ? "text-[var(--ag-color-primary,#165DFF)] font-semibold" : "")}
                  >
                    按热度
                  </button>
                </div>
              </div>

              {/* Works Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorks.map(work => (
                    <div
                      key={work.id}
                      className="bg-[var(--ag-color-surface,#FFFFFF)] rounded-xl overflow-hidden group cursor-pointer transition-colors flex flex-col"
                      onClick={() => onPlayVideo(work)}
                    >
                      {/* Media Cover */}
                      <div className="relative aspect-video w-full bg-[var(--ag-color-surface-strong,#DCE8F9)] overflow-hidden">
                        <img
                          src={work.cover}
                          alt={work.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Play Button Icon */}
                        <div className="absolute inset-0 bg-[#0A1B3D]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-[var(--ag-color-primary,#165DFF)] text-white flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <Play size={18} fill="currentColor" className="ml-0.5" />
                          </div>
                        </div>

                        {/* Header Badge */}
                        <div className="absolute top-2 left-2 bg-[#0A1B3D]/70 text-[10px] text-white px-1.5 py-0.5 rounded font-mono">
                          {work.duration}
                        </div>

                        {/* Footer Badge (Likes) */}
                        <div className="absolute bottom-2 right-2 bg-[#0A1B3D]/70 text-[10px] text-red-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <ThumbsUp size={10} fill="currentColor" />
                          {work.likes}
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="p-3.5 flex flex-col flex-1 justify-between">
                        <h4 className="text-[13px] font-medium text-[var(--ag-color-text-primary,#0A1B3D)] line-clamp-1 group-hover:text-[var(--ag-color-primary,#165DFF)] transition-colors mb-2">
                          {work.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <img src={work.avatar} alt={work.author} className="w-4 h-4 rounded-full object-cover" />
                          <span className="text-[11px] text-[var(--ag-color-text-secondary,#5B6B88)] truncate">{work.author}</span>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Timeline */}
          <div className="space-y-6">
            <div className="bg-[var(--ag-color-surface,#FFFFFF)] rounded-2xl p-6">
              <h3 className="text-[14px] font-bold text-[var(--ag-color-text-primary,#0A1B3D)] mb-5 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[var(--ag-color-warning,#FF7D00)] rounded-full"></span>
                  征集时间
              </h3>

              <div className="relative pl-5 ml-2.5 space-y-6 text-xs text-[var(--ag-color-text-secondary,#5B6B88)]">
                <div className="relative">
                  <div className="absolute -left-[29px] top-0.5 w-3 h-3 rounded-full bg-[var(--ag-color-primary,#165DFF)]" />
                  <div className="font-semibold text-[var(--ag-color-text-primary,#0A1B3D)]">活动启动</div>
                  <div className="text-[11px] text-[var(--ag-color-text-tertiary,#8A97AD)] mt-1">2026年06月30日</div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[29px] top-0.5 w-3 h-3 rounded-full bg-[var(--ag-color-warning,#FF7D00)]" />
                  <div className="font-semibold text-[var(--ag-color-text-primary,#0A1B3D)]">截稿投递</div>
                  <div className="text-[11px] text-[var(--ag-color-text-tertiary,#8A97AD)] mt-1">2026年07月20日 23:59:59</div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[29px] top-0.5 w-3 h-3 rounded-full bg-[var(--ag-color-surface-strong,#DCE8F9)]" />
                  <div className="font-semibold text-[var(--ag-color-text-tertiary,#8A97AD)]">评审与展映</div>
                  <div className="text-[11px] text-[var(--ag-color-text-tertiary,#8A97AD)] mt-1">2026年07月21日 - 07月31日</div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--ag-color-surface,#FFFFFF)] rounded-2xl p-6">
              <h3 className="text-[14px] font-bold text-[var(--ag-color-text-primary,#0A1B3D)] mb-4">
                作品要求
              </h3>
              <ul className="text-xs text-[var(--ag-color-text-secondary,#5B6B88)] space-y-2.5 list-disc list-inside">
                <li>必须使用 AI 生成工具（如即梦 AI 等）辅助制作</li>
                <li>短片总时长须在 30 秒至 15 分钟之间</li>
                <li>内容积极向上，不侵犯第三方肖像权和著作权</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
