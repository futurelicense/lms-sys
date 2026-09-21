import React, { useState, useMemo } from 'react';
import {
  Trophy, Award, Crown, Medal, Swords, Database, Lightbulb,
  Zap, Search, Download, Sparkles, Filter, ChevronRight,
  TrendingUp, CheckCircle, Clock, ExternalLink
} from 'lucide-react';
import {
  useAdminAssessmentAnalytics,
  useAdminAssessmentQuestions,
  useAdminAssessment
} from '../hooks/useAdminAssessments';
import {
  LEETCODE_BADGES,
  LEADERBOARD_CATEGORIES,
  generateLeaderboard,
  exportLeaderboardToCsv
} from '../utils/badgeDefinitions';
import LeetCodeBadge from './LeetCodeBadge';
import BadgeDetailModal from './BadgeDetailModal';
import Spinner from '../../../components/common/Spinner';
import Alert from '../../../components/feedback/Alert';

export const AssessmentLeaderboardTab = ({ assessmentId }) => {
  const { data: analytics, isLoading, error } = useAdminAssessmentAnalytics(assessmentId);
  const { data: questions = [] } = useAdminAssessmentQuestions(assessmentId);
  const { data: assessment } = useAdminAssessment(assessmentId);

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBadgeModal, setSelectedBadgeModal] = useState(null);
  const [filterBadgeId, setFilterBadgeId] = useState('ALL');

  // Compute fully ranked & badge-evaluated leaderboard
  const studentStats = analytics?.studentStats || [];
  const fullLeaderboard = useMemo(() => {
    return generateLeaderboard(studentStats, activeCategory, questions);
  }, [studentStats, activeCategory, questions]);

  // Filter by search & badge filter
  const displayedStudents = useMemo(() => {
    return fullLeaderboard.filter((s) => {
      const matchesSearch =
        !searchTerm ||
        (s.studentName && s.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.studentEmail && s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesBadge =
        filterBadgeId === 'ALL' ||
        (s.badges && s.badges.some((b) => b.id === filterBadgeId));

      return matchesSearch && matchesBadge;
    });
  }, [fullLeaderboard, searchTerm, filterBadgeId]);

  // Top 3 Podium Students
  const top1 = fullLeaderboard[0];
  const top2 = fullLeaderboard[1];
  const top3 = fullLeaderboard[2];

  // Category MVPs
  const overallMvp = fullLeaderboard[0];
  const codingMvp = useMemo(() => {
    const list = generateLeaderboard(studentStats, 'CODING', questions);
    return list[0];
  }, [studentStats, questions]);
  const sqlMvp = useMemo(() => {
    const list = generateLeaderboard(studentStats, 'SQL', questions);
    return list[0];
  }, [studentStats, questions]);
  const speedMvp = useMemo(() => {
    // Student with highest score among fastest
    return fullLeaderboard.find((s) => s.badges.some((b) => b.id === 'speed_demon')) || fullLeaderboard[0];
  }, [fullLeaderboard]);

  const activeCategoryObj = LEADERBOARD_CATEGORIES.find((c) => c.id === activeCategory) || LEADERBOARD_CATEGORIES[0];

  const handleExportCsv = () => {
    exportLeaderboardToCsv(fullLeaderboard, assessment?.title || 'Assessment', activeCategoryObj.label);
  };

  const handleBadgeClick = (badge) => {
    const studentsWithBadge = fullLeaderboard.filter((s) => s.badges.some((b) => b.id === badge.id));
    setSelectedBadgeModal({ badge, students: studentsWithBadge });
  };

  if (isLoading) return <Spinner fullPage={false} />;
  if (error) return <Alert tone="error">Failed to load leaderboard data: {error.message}</Alert>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* ── 1. Top Header & Category Navigation ── */}
      <div
        style={{
          background: 'var(--card-bg, #18181b)',
          border: '1px solid var(--border-color, #27272a)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                }}
              >
                <Trophy size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                Assessment Leaderboard &amp; Badges
              </h2>
            </div>
            <p style={{ margin: '6px 0 0 46px', fontSize: 13, color: 'var(--text-muted)' }}>
              LeetCode-style rankings, topic mastery badges, and real-time category standings.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleExportCsv}
              disabled={fullLeaderboard.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                background: 'var(--bg-secondary, #27272a)',
                border: '1px solid var(--border-color, #3f3f46)',
                color: 'var(--text-primary, #fff)',
                fontSize: 13,
                fontWeight: 600,
                cursor: fullLeaderboard.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: fullLeaderboard.length === 0 ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (fullLeaderboard.length > 0) e.currentTarget.style.background = 'var(--border-color, #3f3f46)';
              }}
              onMouseLeave={(e) => {
                if (fullLeaderboard.length > 0) e.currentTarget.style.background = 'var(--bg-secondary, #27272a)';
              }}
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {LEADERBOARD_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: isActive ? '1.5px solid #f59e0b' : '1px solid var(--border-color, #3f3f46)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.08))'
                    : 'var(--bg-secondary, #27272a)',
                  color: isActive ? '#f59e0b' : 'var(--text-secondary, #a1a1aa)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 4px 14px rgba(245, 158, 11, 0.25)' : 'none',
                }}
              >
                <span>{cat.id === 'ALL' ? '🏆' : cat.id === 'CODING' ? '💻' : cat.id === 'SQL' ? '🗄️' : '🧠'}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Top 3 Podium (Olympic / LeetCode Style) ── */}
      {fullLeaderboard.length > 0 && (
        <div
          style={{
            background: 'var(--card-bg, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: 16,
            padding: '30px 24px 20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Sparkles size={14} /> Podium Honors
            </div>
            <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Top Performers • {activeCategoryObj.label}
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 20,
              flexWrap: 'wrap',
              paddingBottom: 10,
            }}
          >
            {/* Rank #2 (Silver) */}
            {top2 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 220,
                }}
              >
                {/* Silver Avatar */}
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #94a3b8, #64748b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#fff',
                      boxShadow: '0 0 20px rgba(148, 163, 184, 0.45)',
                      border: '3px solid #cbd5e1',
                    }}
                  >
                    {(top2.studentName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -6,
                      right: -6,
                      background: '#64748b',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 26,
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      border: '2px solid #18181b',
                    }}
                  >
                    2
                  </div>
                </div>

                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
                  {top2.studentName || 'Student #2'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {top2.currentCategoryScore.score} / {top2.currentCategoryScore.totalMarks} ({top2.currentCategoryScore.percentage}%)
                </div>

                {/* Silver Pedestal */}
                <div
                  style={{
                    width: '100%',
                    height: 90,
                    background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.25) 0%, rgba(100, 116, 139, 0.08) 100%)',
                    borderRadius: '12px 12px 0 0',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: 8,
                  }}
                >
                  <span style={{ fontSize: 24 }}>🥈</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>SILVER</span>
                </div>
              </div>
            )}

            {/* Rank #1 (Gold - Center & Elevated) */}
            {top1 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 250,
                  transform: 'translateY(-12px)',
                }}
              >
                {/* Crown Icon */}
                <span style={{ fontSize: 28, marginBottom: 4, filter: 'drop-shadow(0 4px 8px rgba(245, 158, 11, 0.5))' }}>
                  👑
                </span>

                {/* Gold Avatar */}
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      fontWeight: 800,
                      color: '#fff',
                      boxShadow: '0 0 30px rgba(245, 158, 11, 0.6)',
                      border: '4px solid #fef08a',
                    }}
                  >
                    {(top1.studentName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -6,
                      right: -4,
                      background: '#d97706',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 30,
                      height: 30,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      fontWeight: 800,
                      border: '2px solid #18181b',
                    }}
                  >
                    1
                  </div>
                </div>

                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center' }}>
                  {top1.studentName || 'Champion'}
                </div>
                <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 8 }}>
                  {top1.currentCategoryScore.score} / {top1.currentCategoryScore.totalMarks} ({top1.currentCategoryScore.percentage}%)
                </div>

                {/* Gold Pedestal */}
                <div
                  style={{
                    width: '100%',
                    height: 125,
                    background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.1) 100%)',
                    borderRadius: '16px 16px 0 0',
                    border: '1.5px solid rgba(245, 158, 11, 0.55)',
                    boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: 8,
                  }}
                >
                  <span style={{ fontSize: 28 }}>🥇</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fef08a', letterSpacing: '0.05em' }}>GOLD MVP</span>
                  {top1.badges.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {top1.badges.slice(0, 2).map((b) => (
                        <LeetCodeBadge key={b.id} badge={b} size="xs" onClick={handleBadgeClick} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rank #3 (Bronze) */}
            {top3 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 220,
                }}
              >
                {/* Bronze Avatar */}
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #d97706, #78350f)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#fff',
                      boxShadow: '0 0 20px rgba(217, 119, 6, 0.35)',
                      border: '3px solid #fcd34d',
                    }}
                  >
                    {(top3.studentName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -6,
                      right: -6,
                      background: '#78350f',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 26,
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      border: '2px solid #18181b',
                    }}
                  >
                    3
                  </div>
                </div>

                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
                  {top3.studentName || 'Student #3'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {top3.currentCategoryScore.score} / {top3.currentCategoryScore.totalMarks} ({top3.currentCategoryScore.percentage}%)
                </div>

                {/* Bronze Pedestal */}
                <div
                  style={{
                    width: '100%',
                    height: 75,
                    background: 'linear-gradient(180deg, rgba(217, 119, 6, 0.25) 0%, rgba(120, 53, 15, 0.08) 100%)',
                    borderRadius: '12px 12px 0 0',
                    border: '1px solid rgba(217, 119, 6, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: 8,
                  }}
                >
                  <span style={{ fontSize: 22 }}>🥉</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fde68a' }}>BRONZE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Category MVP Highlights Spotlight ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {/* Overall MVP */}
        <div
          style={{
            background: 'var(--card-bg, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            👑
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase' }}>Overall Leader</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {overallMvp?.studentName || 'None yet'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {overallMvp ? `${overallMvp.overallScore.percentage}% score` : 'No submissions'}
            </div>
          </div>
        </div>

        {/* Algorithm MVP */}
        <div
          style={{
            background: 'var(--card-bg, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            ⚔️
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#a855f7', textTransform: 'uppercase' }}>Algorithm Knight</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {codingMvp?.studentName || 'None yet'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {codingMvp ? `${codingMvp.currentCategoryScore.percentage}% algorithms` : 'No submissions'}
            </div>
          </div>
        </div>

        {/* SQL Grandmaster */}
        <div
          style={{
            background: 'var(--card-bg, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            🗄️
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase' }}>SQL Grandmaster</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {sqlMvp?.studentName || 'None yet'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {sqlMvp ? `${sqlMvp.currentCategoryScore.percentage}% queries` : 'No submissions'}
            </div>
          </div>
        </div>

        {/* Speed Record */}
        <div
          style={{
            background: 'var(--card-bg, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            ⚡
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#06b6d4', textTransform: 'uppercase' }}>Speed Champion</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {speedMvp?.studentName || 'None yet'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {speedMvp ? 'Record completion' : 'No submissions'}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Search & Badge Filter Bar ── */}
      <div
        style={{
          background: 'var(--card-bg, #18181b)',
          border: '1px solid var(--border-color, #27272a)',
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: 240 }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search candidate name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 8,
                background: 'var(--bg-secondary, #27272a)',
                border: '1px solid var(--border-color, #3f3f46)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {/* Badge Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Badge:</span>
            <select
              value={filterBadgeId}
              onChange={(e) => setFilterBadgeId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--bg-secondary, #27272a)',
                border: '1px solid var(--border-color, #3f3f46)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Badges</option>
              {LEETCODE_BADGES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.glyph} {b.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Showing <strong>{displayedStudents.length}</strong> of {fullLeaderboard.length} learners
        </div>
      </div>

      {/* ── 5. Full Leaderboard Standings Table ── */}
      <div
        style={{
          background: 'var(--card-bg, #18181b)',
          border: '1px solid var(--border-color, #27272a)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary, #27272a)', borderBottom: '1px solid var(--border-color, #3f3f46)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: 80 }}>Rank</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Student</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Badges Unlocked</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>{activeCategoryObj.label} Score</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: 120 }}>Overall Score</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: 90 }}>Grade</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: 90 }}>Attempts</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, width: 110 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
                      No Leaderboard Standings Yet
                    </div>
                    <div>Students will automatically appear here as they complete their assessments.</div>
                  </td>
                </tr>
              ) : (
                displayedStudents.map((s) => {
                  const isTop1 = s.rank === 1;
                  const isTop2 = s.rank === 2;
                  const isTop3 = s.rank === 3;

                  return (
                    <tr
                      key={s.studentId || s.id}
                      style={{
                        borderBottom: '1px solid var(--border-color, #27272a)',
                        transition: 'background 0.15s',
                        background: isTop1
                          ? 'rgba(245, 158, 11, 0.04)'
                          : isTop2
                          ? 'rgba(148, 163, 184, 0.03)'
                          : isTop3
                          ? 'rgba(217, 119, 6, 0.03)'
                          : 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary, #27272a)')}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isTop1
                          ? 'rgba(245, 158, 11, 0.04)'
                          : isTop2
                          ? 'rgba(148, 163, 184, 0.03)'
                          : isTop3
                          ? 'rgba(217, 119, 6, 0.03)'
                          : 'transparent';
                      }}
                    >
                      {/* Rank */}
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isTop1 ? (
                            <span style={{ fontSize: 18 }}>🥇</span>
                          ) : isTop2 ? (
                            <span style={{ fontSize: 18 }}>🥈</span>
                          ) : isTop3 ? (
                            <span style={{ fontSize: 18 }}>🥉</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>#{s.rank}</span>
                          )}
                        </div>
                      </td>

                      {/* Student */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: isTop1 ? '#f59e0b' : isTop2 ? '#94a3b8' : isTop3 ? '#d97706' : 'var(--border-color, #3f3f46)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 13,
                              flexShrink: 0,
                            }}
                          >
                            {(s.studentName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {s.studentName || 'Anonymous Student'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {s.studentEmail || 'No email registered'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Badges Unlocked */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                          {s.badges && s.badges.length > 0 ? (
                            s.badges.map((b) => (
                              <LeetCodeBadge
                                key={b.id}
                                badge={b}
                                size="xs"
                                onClick={handleBadgeClick}
                              />
                            ))
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No badges yet
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category Score & Progress */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 140 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {s.currentCategoryScore.score} / {s.currentCategoryScore.totalMarks}
                            </span>
                            <span style={{ fontWeight: 600, color: '#f59e0b' }}>
                              {s.currentCategoryScore.percentage}%
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 99, background: 'var(--border-color, #3f3f46)', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${s.currentCategoryScore.percentage}%`,
                                background: isTop1 ? '#f59e0b' : 'var(--primary-color, #3b82f6)',
                                borderRadius: 99,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Overall Score */}
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.overallScore.score} / {s.overallScore.totalMarks}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                          ({s.overallScore.percentage}%)
                        </span>
                      </td>

                      {/* Grade */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background:
                              s.gradeLetter === 'A+' || s.gradeLetter === 'A'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : s.gradeLetter === 'B'
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(148, 163, 184, 0.15)',
                            color:
                              s.gradeLetter === 'A+' || s.gradeLetter === 'A'
                                ? '#10b981'
                                : s.gradeLetter === 'B'
                                ? '#3b82f6'
                                : 'var(--text-muted)',
                            border: `1px solid ${
                              s.gradeLetter === 'A+' || s.gradeLetter === 'A' ? '#10b98140' : '#3b82f640'
                            }`,
                          }}
                        >
                          {s.gradeLetter || 'N/A'}
                        </span>
                      </td>

                      {/* Attempts */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {s.attemptsCount || 1}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: s.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                            color: s.status === 'COMPLETED' ? '#10b981' : '#eab308',
                          }}
                        >
                          {s.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. Badge Detail Modal (Interactive Click) ── */}
      {selectedBadgeModal && (
        <BadgeDetailModal
          badge={selectedBadgeModal.badge}
          studentsWithBadge={selectedBadgeModal.students}
          onClose={() => setSelectedBadgeModal(null)}
        />
      )}
    </div>
  );
};

export default AssessmentLeaderboardTab;
