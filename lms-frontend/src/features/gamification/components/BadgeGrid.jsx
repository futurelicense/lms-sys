import React, { useState, useMemo } from 'react';
import { Award, CheckCircle2, Lock } from 'lucide-react';
import BadgeCard from './BadgeCard';

export const BadgeGrid = ({ badges = [] }) => {
  const [activeFilter, setActiveFilter] = useState('ALL');

  const earnedBadges = useMemo(() => badges.filter((b) => Boolean(b.awardedAt)), [badges]);
  const lockedBadges = useMemo(() => badges.filter((b) => !b.awardedAt), [badges]);

  const filteredBadges = useMemo(() => {
    if (activeFilter === 'EARNED') return earnedBadges;
    if (activeFilter === 'LOCKED') return lockedBadges;
    return badges;
  }, [activeFilter, badges, earnedBadges, lockedBadges]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Badges & Achievements</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {earnedBadges.length} / {badges.length}
          </span>
        </div>

        {/* Filter buttons */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 transition ${
              activeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            All ({badges.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('EARNED')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 transition ${
              activeFilter === 'EARNED'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Earned ({earnedBadges.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('LOCKED')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 transition ${
              activeFilter === 'LOCKED'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="h-3 w-3 text-slate-400" />
            Locked ({lockedBadges.length})
          </button>
        </div>
      </div>

      {filteredBadges.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
          <Award className="h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            No badges found
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Complete courses, lessons, and assessments to earn your first badges!
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgeGrid;
