import React from 'react';
import { Plus } from 'lucide-react';

import type { SkillCategory } from '../../types';

interface SkillsTabProps {
  filteredSkills: SkillCategory[];
}

export const SkillsTab: React.FC<SkillsTabProps> = ({ filteredSkills }) => {
  return (
    <div className="space-y-12">
      {filteredSkills.length === 0 ? (
            <div className="text-center py-20 text-[var(--ag-color-text-tertiary,#8A97AD)] text-sm">
              没有找到符合条件的创意技能
            </div>
          ) : (
            filteredSkills.map(category => (
              <div key={category.category} className="space-y-4">
                {/* Category Label */}
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[var(--ag-color-primary,#165DFF)] rounded-full"></span>
                  <h2 className="text-[15px] font-bold text-[var(--ag-color-text-primary,#0A1B3D)] tracking-wide">
                    {category.category}
                  </h2>
                </div>

                {/* Skill Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {category.items.map(skill => (
                      <div
                        key={skill.id}
                        className="bg-[var(--ag-color-surface,#FFFFFF)] hover:bg-[var(--ag-color-surface-muted,#EAF1FB)] transition-colors p-5 rounded-2xl relative flex flex-col justify-between h-[180px] group cursor-pointer"
                      >
                        {/* Plus button inside top-right card */}
                        <button className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[var(--ag-color-surface-muted,#EAF1FB)] hover:bg-[var(--ag-color-surface-strong,#DCE8F9)] text-[var(--ag-color-text-secondary,#5B6B88)] hover:text-[var(--ag-color-primary,#165DFF)] flex items-center justify-center transition-colors">
                          <Plus size={14} />
                        </button>

                        {/* Top part */}
                        <div>
                          <h3 className="text-[13.5px] font-bold text-[var(--ag-color-text-primary,#0A1B3D)] pr-6 leading-normal group-hover:text-[var(--ag-color-primary,#165DFF)] transition-colors">
                            {skill.title}
                          </h3>
                          <p className="text-[11.5px] text-[var(--ag-color-text-secondary,#5B6B88)] mt-2 line-clamp-3 leading-relaxed">
                            {skill.desc}
                          </p>
                        </div>

                        {/* Bottom metadata */}
                        <div className="flex items-center justify-between pt-3 mt-1.5">
                          <div className="flex items-center gap-1 text-[11px] text-[var(--ag-color-text-tertiary,#8A97AD)]">
                            <span>❤️ {skill.likes}</span>
                            <span className="text-[var(--ag-color-surface-strong,#DCE8F9)]">•</span>
                            <span className="truncate max-w-[90px]">来自 · {skill.author}</span>
                          </div>
                          <span className="text-[10px] text-[var(--ag-color-text-secondary,#5B6B88)] bg-[var(--ag-color-surface-muted,#EAF1FB)] group-hover:bg-[var(--ag-color-primary-subtle,#E8F0FF)] group-hover:text-[var(--ag-color-primary,#165DFF)] px-2 py-0.5 rounded-full transition-colors">
                            使用
                          </span>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            ))
      )}
    </div>
  );
};
