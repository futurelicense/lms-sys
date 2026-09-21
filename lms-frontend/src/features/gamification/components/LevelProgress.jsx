import React from 'react';
import { GamificationIcon } from '../constants/gamificationConstants';

export const LevelProgress = ({ currentLevel, levelProgress = 0, totalPoints = 0 }) => {
  const levelNumber = currentLevel?.levelNumber ?? 1;
  const title = currentLevel?.title ?? 'Novice';
  const minPoints = currentLevel?.minPoints ?? 0;
  const maxPoints = currentLevel?.maxPoints;

  const isMaxLevel = maxPoints == null;
  const pointsToNext = isMaxLevel ? 0 : Math.max(0, maxPoints + 1 - totalPoints);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md shadow-amber-500/20">
            <GamificationIcon name={currentLevel?.icon || 'shield'} className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Level {levelNumber}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {isMaxLevel
                ? 'Max level achieved!'
                : `${pointsToNext.toLocaleString()} points needed for Level ${levelNumber + 1}`}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {Math.min(100, Math.max(0, levelProgress))}%
          </span>
        </div>
      </div>

      {/* Progress track */}
      <div className="mt-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, levelProgress))}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>{minPoints.toLocaleString()} pts</span>
          <span>{isMaxLevel ? 'Infinity' : `${maxPoints.toLocaleString()} pts`}</span>
        </div>
      </div>
    </div>
  );
};

export default LevelProgress;
