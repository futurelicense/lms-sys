import React from 'react';
import { Trophy, Medal, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { LEADERBOARD_PERIODS } from '../constants/gamificationConstants';

export const LeaderboardTable = ({
  data,
  currentStudent,
  period,
  onPeriodChange,
  page = 0,
  onPageChange,
  isLoading,
}) => {
  const entries = data?.content || [];
  const totalPages = data?.totalPages ?? 1;
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;

  const renderRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm shadow-amber-400/40">
          <Trophy className="h-4 w-4" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-200">
          <Medal className="h-4 w-4" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 text-amber-100 shadow-sm">
          <Medal className="h-4 w-4" />
        </span>
      );
    }
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-slate-500 dark:text-slate-400">
        #{rank}
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Leaderboard</h3>
        </div>

        {/* Period Filter Tabs */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800">
          {LEADERBOARD_PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onPeriodChange(p.value)}
              className={`rounded-lg px-3 py-1.5 transition ${
                period === p.value
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current Student's Rank Banner if available */}
      {currentStudent && currentStudent.rank && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-indigo-50/70 px-4 py-2.5 dark:bg-indigo-950/30">
          <div className="flex items-center gap-2.5">
            <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
              Your Rank #{currentStudent.rank}
            </span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {currentStudent.studentName}
            </span>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {currentStudent.totalPoints?.toLocaleString()} pts
          </span>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <th className="py-3 pl-3 pr-2 w-16">Rank</th>
              <th className="py-3 px-3">Student</th>
              <th className="py-3 px-3">Level</th>
              <th className="py-3 px-3 text-center">Badges</th>
              <th className="py-3 pr-3 pl-2 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                  Loading rankings...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                  No leaderboard data for this period yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isCurrent = currentStudent?.studentId === entry.studentId;
                return (
                  <tr
                    key={entry.studentId}
                    className={`transition ${
                      isCurrent
                        ? 'bg-indigo-50/50 font-semibold dark:bg-indigo-950/20'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 pl-3 pr-2">{renderRankBadge(entry.rank)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="truncate max-w-[180px] text-slate-900 dark:text-slate-100">
                          {entry.studentName}
                          {isCurrent && (
                            <span className="ml-1.5 text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
                              (You)
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
                      {entry.levelTitle || 'Novice'}
                    </td>
                    <td className="py-3 px-3 text-center text-xs text-slate-600 dark:text-slate-400">
                      {entry.badgeCount ?? 0}
                    </td>
                    <td className="py-3 pr-3 pl-2 text-right font-bold text-slate-900 dark:text-slate-100">
                      {entry.totalPoints?.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isFirstPage}
              onClick={() => onPageChange(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={isLastPage}
              onClick={() => onPageChange(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;
