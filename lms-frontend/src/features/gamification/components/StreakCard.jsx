import React from 'react';
import { Flame, Calendar, Trophy } from 'lucide-react';

export const StreakCard = ({ streak }) => {
  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;
  const lastActivityDate = streak?.lastActivityDate;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50/40 p-6 shadow-sm dark:border-orange-950/40 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Flame className="h-5 w-5 animate-bounce" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Learning Streak</h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-orange-100/80 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-950/50 dark:text-orange-300">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          <span>Record: {longestStreak}d</span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          {currentStreak}
        </span>
        <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
          {currentStreak === 1 ? 'day streak' : 'days streak'}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
        {currentStreak === 0
          ? 'Complete a lesson or quiz today to start your learning streak!'
          : currentStreak < 7
            ? 'Great momentum! Keep learning daily to build a powerful habit.'
            : 'Unstoppable! You are in the top tier of consistent learners.'}
      </p>

      {lastActivityDate && (
        <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-orange-100 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>Last active: {new Date(lastActivityDate).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
};

export default StreakCard;
