import React from 'react';
import { Clock, Award, Users } from 'lucide-react';
import type { Activity } from '../../types';

interface ActivitiesTabProps {
  filteredActivities: Activity[];
  onSelectActivity: (activity: Activity) => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ filteredActivities, onSelectActivity }) => {
  return (
    <div>
      {filteredActivities.length === 0 ? (
            <div className="text-center py-20 text-[var(--ag-color-text-tertiary,#8A97AD)] text-sm">
              没有找到相关的赛事活动
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="bg-[var(--ag-color-surface,#FFFFFF)] hover:bg-[var(--ag-color-surface-muted,#EAF1FB)] rounded-2xl overflow-hidden group cursor-pointer transition-colors flex flex-col h-[280px]"
                    onClick={() => onSelectActivity(activity)}
                  >
                    {/* Top Wide Cover image of Activity */}
                    <div className="relative h-[140px] w-full bg-[var(--ag-color-surface-strong,#DCE8F9)] overflow-hidden shrink-0">
                      <img
                        src={activity.cover}
                        alt={activity.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-[var(--ag-color-scrim,rgba(10,27,61,0.45))]" />

                      {/* Countdown / Status Tag in top-left */}
                      <div className="absolute top-3 left-3 bg-[var(--ag-color-warning,#FF7D00)] text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                        <Clock size={11} />
                        {activity.status}
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-[13.5px] font-bold text-[var(--ag-color-text-primary,#0A1B3D)] line-clamp-1 group-hover:text-[var(--ag-color-primary,#165DFF)] transition-colors leading-snug">
                          {activity.title}
                        </h3>
                        <p className="text-[11.5px] text-[var(--ag-color-text-secondary,#5B6B88)] mt-1.5 line-clamp-2 leading-relaxed">
                          {activity.desc}
                        </p>
                      </div>

                      {/* Footer Details */}
                      <div className="flex items-center justify-between pt-3 mt-2 text-[11px] text-[var(--ag-color-text-tertiary,#8A97AD)]">
                        <div className="flex items-center gap-1 text-[var(--ag-color-warning,#FF7D00)] font-medium">
                          <Award size={12} />
                          <span className="truncate max-w-[200px]">{activity.tag}</span>
                        </div>
                        <span className="shrink-0 text-[var(--ag-color-text-secondary,#5B6B88)] flex items-center gap-1 font-mono">
                          <Users size={11} />
                          已有 {activity.participants} 人参与
                        </span>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
      )}
    </div>
  );
};
