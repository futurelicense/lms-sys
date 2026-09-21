import React from 'react';
import { Lock, Check } from 'lucide-react';
import { GamificationIcon } from '../constants/gamificationConstants';

export const BadgeCard = ({ badge }) => {
  const isEarned = Boolean(badge.awardedAt);

  return (
    <div
      className={`group relative flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-300 ${
        isEarned
          ? 'border-amber-200/70 bg-gradient-to-b from-amber-50/50 to-white shadow-sm hover:-translate-y-1 hover:border-amber-300 hover:shadow-md dark:border-amber-900/30 dark:from-amber-950/20 dark:to-slate-900'
          : 'border-slate-200/60 bg-slate-50/50 opacity-60 dark:border-slate-800/60 dark:bg-slate-900/40'
      }`}
    >
      {/* Status indicator pill */}
      <div className="absolute right-3 top-3">
        {isEarned ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
            <Check className="h-3 w-3 stroke-[3]" />
          </span>
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Lock className="h-3 w-3" />
          </span>
        )}
      </div>

      {/* Badge Icon Emblem */}
      <div
        className={`relative flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
          isEarned
            ? 'bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/25 ring-4 ring-amber-100 dark:ring-amber-950'
            : 'bg-slate-200 text-slate-400 ring-4 ring-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-800/50'
        }`}
      >
        <GamificationIcon name={badge.icon} className="h-8 w-8" />
      </div>

      <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">{badge.name}</h4>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
        {badge.description}
      </p>

      {/* Category tag & earned date */}
      <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
        {badge.category && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {badge.category}
          </span>
        )}
        {isEarned && badge.awardedAt && (
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Earned {new Date(badge.awardedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default BadgeCard;
