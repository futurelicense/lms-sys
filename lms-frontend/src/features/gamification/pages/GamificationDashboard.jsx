import React, { useState, useRef } from 'react';
import { History, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useGamificationSummary,
  useStudentBadges,
  useStudentMilestones,
  useStudentStreak,
  usePointsHistory,
} from '../hooks/useGamification';
import { useLeaderboard } from '../hooks/useLeaderboard';
import PointsSummary from '../components/PointsSummary';
import LevelProgress from '../components/LevelProgress';
import StreakCard from '../components/StreakCard';
import BadgeGrid from '../components/BadgeGrid';
import MilestoneList from '../components/MilestoneList';
import LeaderboardTable from '../components/LeaderboardTable';
import { EVENT_TYPE_LABELS } from '../constants/gamificationConstants';

export const GamificationDashboard = () => {
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('ALL_TIME');
  const [leaderboardPage, setLeaderboardPage] = useState(0);
  const [pointsHistoryPage, setPointsHistoryPage] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const leaderboardRef = useRef(null);

  const { data: summary, isLoading: isSummaryLoading } = useGamificationSummary();
  const { data: badges = [], isLoading: isBadgesLoading } = useStudentBadges();
  const { data: milestones = [], isLoading: isMilestonesLoading } = useStudentMilestones();
  const { data: streak, isLoading: isStreakLoading } = useStudentStreak();

  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useLeaderboard({
    period: leaderboardPeriod,
    page: leaderboardPage,
    size: 10,
  });

  const { data: pointsHistoryData, isLoading: isHistoryLoading } = usePointsHistory({
    page: pointsHistoryPage,
    size: 8,
  });

  const scrollToLeaderboard = () => {
    if (leaderboardRef.current) {
      leaderboardRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isLoading = isSummaryLoading && isBadgesLoading && isMilestonesLoading && isStreakLoading;

  if (isLoading) {
    return (
      <div className="w-full space-y-6 animate-pulse" style={{ width: '100%', padding: '24px 0' }}>
        <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  const effectiveSummary = summary || {
    totalPoints: 1420,
    currentLevel: 4,
    levelProgress: 68,
    rank: 3,
  };

  const effectiveStreak = streak || {
    currentStreak: 4,
    longestStreak: 14,
    activeDays: [true, true, true, true, false, false, false],
  };

  const historyTotalPages = pointsHistoryData?.totalPages ?? 1;

  return (
    <div className="w-full space-y-8" style={{ width: '100%', paddingBottom: 40 }}>
      {/* Hero Points Summary Banner */}
      <PointsSummary summary={effectiveSummary} onOpenLeaderboard={scrollToLeaderboard} />

      {/* Grid Row 1: Level Progress + Streak Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LevelProgress
            currentLevel={effectiveSummary?.currentLevel}
            levelProgress={effectiveSummary?.levelProgress ?? 0}
            totalPoints={effectiveSummary?.totalPoints ?? 0}
          />
        </div>
        <div>
          <StreakCard streak={effectiveStreak} />
        </div>
      </div>

      {/* Grid Row 2: Badges Grid */}
      <BadgeGrid badges={badges} />

      {/* Grid Row 3: Milestones & Leaderboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MilestoneList milestones={milestones} />
        <div ref={leaderboardRef}>
          <LeaderboardTable
            data={leaderboardData?.entries}
            currentStudent={leaderboardData?.currentStudent}
            period={leaderboardPeriod}
            onPeriodChange={(newPeriod) => {
              setLeaderboardPeriod(newPeriod);
              setLeaderboardPage(0);
            }}
            page={leaderboardPage}
            onPageChange={setLeaderboardPage}
            isLoading={isLeaderboardLoading}
          />
        </div>
      </div>

      {/* Points History Toggle Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Points History & Ledger
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>

        {showHistory && (
          <div className="mt-5 space-y-4">
            {isHistoryLoading ? (
              <p className="py-6 text-center text-xs text-slate-400">Loading points history...</p>
            ) : pointsHistoryData?.content?.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No points recorded yet.</p>
            ) : (
              <>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pointsHistoryData?.content?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {EVENT_TYPE_LABELS[item.eventType] || item.eventType}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        +{item.points} pts
                      </span>
                    </div>
                  ))}
                </div>

                {historyTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="text-xs text-slate-500">
                      Page {pointsHistoryPage + 1} of {historyTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={pointsHistoryPage === 0}
                        onClick={() => setPointsHistoryPage((p) => Math.max(0, p - 1))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={pointsHistoryPage >= historyTotalPages - 1}
                        onClick={() => setPointsHistoryPage((p) => p + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamificationDashboard;
