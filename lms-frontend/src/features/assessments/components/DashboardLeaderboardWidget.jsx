import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Award, Sparkles, ArrowRight, Swords, Database, Zap, Crown } from 'lucide-react';
import { useAdminAssessments, useAdminAssessmentAnalytics } from '../hooks/useAdminAssessments';
import { generateLeaderboard, LEETCODE_BADGES } from '../utils/badgeDefinitions';
import LeetCodeBadge from './LeetCodeBadge';
import BadgeDetailModal from './BadgeDetailModal';
import { ROUTES } from '../../../constants/routes';

export const DashboardLeaderboardWidget = ({ isInstructor = false }) => {
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Fetch assessments to find the active or most recent one
  const { data: assessmentsData, isLoading: listLoading } = useAdminAssessments({ page: 0, size: 5 });
  const assessments =
    assessmentsData?.content ||
    assessmentsData?.data?.content ||
    (Array.isArray(assessmentsData) ? assessmentsData : []);

  const firstAssessment = assessments.find((a) => a.status === 'PUBLISHED') || assessments[0];
  const assessmentId = firstAssessment?.id;

  const { data: analytics, isLoading: analyticsLoading } = useAdminAssessmentAnalytics(assessmentId);
  const studentStats = analytics?.studentStats || [];

  const leaderboard = React.useMemo(() => {
    if (!studentStats.length) return [];
    return generateLeaderboard(studentStats, 'ALL');
  }, [studentStats]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  const codingChampion = React.useMemo(() => {
    if (!studentStats.length) return null;
    const codingList = generateLeaderboard(studentStats, 'CODING');
    return codingList[0];
  }, [studentStats]);

  const sqlChampion = React.useMemo(() => {
    if (!studentStats.length) return null;
    const sqlList = generateLeaderboard(studentStats, 'SQL');
    return sqlList[0];
  }, [studentStats]);

  const targetHistoryRoute = isInstructor
    ? ROUTES.INSTRUCTOR_SUBMISSIONS_HISTORY
    : ROUTES.ADMIN_SUBMISSIONS_HISTORY;
  const targetHistoryUrl = firstAssessment
    ? `${targetHistoryRoute}?assessmentId=${firstAssessment.id}`
    : targetHistoryRoute;

  return (
    <div
      style={{
        background: 'var(--surface-medium, #18181b)',
        border: '1px solid var(--border-color, #27272a)',
        borderRadius: 18,
        padding: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color, #27272a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Trophy size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Hall of Fame &amp; Category Champions
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              {firstAssessment ? `Top performers for "${firstAssessment.title}"` : 'Global assessment leaders & badges'}
            </p>
          </div>
        </div>

        <Link
          to={targetHistoryUrl}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: '#60a5fa',
            textDecoration: 'none',
          }}
        >
          View Full Leaderboard <ArrowRight size={14} />
        </Link>
      </div>

      {/* Podium Cards / Top Performers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* 1st Place Gold */}
        <div
          style={{
            background: 'var(--surface-medium, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            🥇
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#eab308', textTransform: 'uppercase' }}>
              Rank #1 • Gold MVP
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {top1?.studentName || 'Awaiting Submissions'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {top1 ? `${top1.overallScore.percentage}% score` : 'No attempts yet'}
            </div>
          </div>
          {top1?.badges?.[0] && (
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <LeetCodeBadge badge={top1.badges[0]} size="xs" onClick={(b) => setSelectedBadge(b)} />
            </div>
          )}
        </div>

        {/* Algorithm Champion */}
        <div
          style={{
            background: 'var(--surface-medium, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            ⚔️
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
              Algorithm Knight
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {codingChampion?.studentName || 'Awaiting Submissions'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {codingChampion ? `${codingChampion.currentCategoryScore.percentage}% algorithms` : 'No attempts yet'}
            </div>
          </div>
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <LeetCodeBadge
              badge={LEETCODE_BADGES.find((b) => b.id === 'knight')}
              size="xs"
              onClick={(b) => setSelectedBadge(b)}
            />
          </div>
        </div>

        {/* Database & SQL Grandmaster */}
        <div
          style={{
            background: 'var(--surface-medium, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            🗄️
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' }}>
              SQL Grandmaster
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {sqlChampion?.studentName || 'Awaiting Submissions'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {sqlChampion ? `${sqlChampion.currentCategoryScore.percentage}% queries` : 'No attempts yet'}
            </div>
          </div>
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <LeetCodeBadge
              badge={LEETCODE_BADGES.find((b) => b.id === 'sql_master')}
              size="xs"
              onClick={(b) => setSelectedBadge(b)}
            />
          </div>
        </div>
      </div>

      {/* Badge Lore Modal */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};

export default DashboardLeaderboardWidget;
