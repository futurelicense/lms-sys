import React from 'react';
import { Target, CheckCircle2, Clock } from 'lucide-react';
import { GamificationIcon } from '../constants/gamificationConstants';

export const MilestoneList = ({ milestones = [] }) => {
  const completedCount = milestones.filter((m) => m.completed).length;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Milestones</h3>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
          {completedCount} / {milestones.length} Completed
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {milestones.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No milestones configured yet.
          </p>
        ) : (
          milestones.map((milestone) => {
            const isCompleted = milestone.completed;

            return (
              <div
                key={milestone.id || milestone.key}
                className={`flex items-start gap-3 rounded-xl border p-3.5 transition ${
                  isCompleted
                    ? 'border-emerald-200/70 bg-emerald-50/30 dark:border-emerald-950/40 dark:bg-emerald-950/10'
                    : 'border-slate-200/60 bg-slate-50/40 dark:border-slate-800/60 dark:bg-slate-900/30'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <GamificationIcon name={milestone.icon || 'target'} className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-sm font-bold truncate ${
                        isCompleted
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {milestone.name}
                    </h4>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        In Progress
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {milestone.description}
                  </p>

                  {isCompleted && milestone.completedAt && (
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      Unlocked on {new Date(milestone.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MilestoneList;
