import React from 'react';
import { Sparkles, Trophy, Award, Flame } from 'lucide-react';

export const PointsSummary = ({ summary, onOpenLeaderboard }) => {
  const totalPoints = summary?.totalPoints ?? 0;
  const badgeCount = summary?.badgeCount ?? 0;
  const currentStreak = summary?.currentStreak ?? 0;
  const levelTitle = summary?.currentLevel?.title ?? 'Novice';
  const levelNumber = summary?.currentLevel?.levelNumber ?? 1;
  const rank = summary?.leaderboardRank;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white shadow-xl shadow-indigo-500/10">
      {/* Ambient background blur blobs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-purple-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-indigo-300/20 blur-2xl" />

      <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            <span>Learning Journey</span>
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              {totalPoints.toLocaleString()}
            </h2>
            <span className="text-lg font-medium text-indigo-200">total points</span>
          </div>

          <p className="mt-1 text-sm text-indigo-200">
            Level {levelNumber} • {levelTitle}
          </p>
        </div>

        {/* Mini stats pills */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center rounded-xl bg-white/10 px-4 py-3 backdrop-blur-md transition hover:bg-white/15">
            <Award className="h-5 w-5 text-amber-300" />
            <span className="mt-1 text-lg font-bold">{badgeCount}</span>
            <span className="text-[11px] font-medium text-indigo-200">Badges</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl bg-white/10 px-4 py-3 backdrop-blur-md transition hover:bg-white/15">
            <Flame className="h-5 w-5 text-orange-400" />
            <span className="mt-1 text-lg font-bold">{currentStreak}d</span>
            <span className="text-[11px] font-medium text-indigo-200">Streak</span>
          </div>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="flex flex-col items-center justify-center rounded-xl bg-white/10 px-4 py-3 backdrop-blur-md transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <Trophy className="h-5 w-5 text-yellow-300" />
            <span className="mt-1 text-lg font-bold">{rank ? `#${rank}` : '-'}</span>
            <span className="text-[11px] font-medium text-indigo-200">Rank</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointsSummary;
