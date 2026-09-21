import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutList,
  LayoutGrid,
  ChevronDown,
  BookOpen,
  Search,
  Clock,
  Award,
  Play,
  CheckCircle2,
  Filter,
  Sparkles,
  ArrowRight,
  Layers,
  GraduationCap,
  Star,
  Download,
  Flame,
  Target,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';
import { useMyCourses } from '../hooks/useCourses';
import { ROUTES } from '../../../constants/routes';
import Avatar from '../../../components/common/Avatar';
import { useResources } from '../../resources/hooks/useResources';
import resourceService from '../../resources/services/resourceService';

/* ─── Tech Visual Presets & SVG Emblems ─── */
const TECH_PRESETS = {
  react: {
    name: 'React Ecosystem',
    accent: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0c2340 0%, #0369a1 60%, #0284c7 100%)',
    glow: 'rgba(56, 189, 248, 0.25)',
    border: 'rgba(56, 189, 248, 0.3)',
    pillBg: 'rgba(56, 189, 248, 0.15)',
    pillColor: '#7dd3fc',
    emblem: (
      <svg width="40" height="40" viewBox="-11.5 -10.23174 23 20.46348" fill="none">
        <circle cx="0" cy="0" r="2.05" fill="#38bdf8" />
        <g stroke="#38bdf8" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    ),
  },
  angular: {
    name: 'Angular Framework',
    accent: '#f43f5e',
    gradient: 'linear-gradient(135deg, #4c0519 0%, #be123c 60%, #e11d48 100%)',
    glow: 'rgba(244, 63, 94, 0.25)',
    border: 'rgba(244, 63, 94, 0.3)',
    pillBg: 'rgba(244, 63, 94, 0.15)',
    pillColor: '#fda4af',
    emblem: (
      <svg width="40" height="40" viewBox="0 0 250 250" fill="none">
        <polygon points="125,30 125,30 125,30 31.9,63.2 46.1,186.3 125,230 125,230 125,230 203.9,186.3 218.1,63.2" fill="rgba(244,63,94,0.3)" stroke="#f43f5e" strokeWidth="14" />
        <polygon points="125,52.1 125,153.4 125,153.4 125,207 182.2,175.2 193.3,79.1" fill="rgba(244,63,94,0.5)" />
        <path d="M125 78.5L84.2 173.3h18.8l8.2-20.7h27.6v-15.4h-21.4l12.6-31.5L125 78.5z" fill="#fff" />
      </svg>
    ),
  },
  fullstack: {
    name: 'Full-Stack Architecture',
    accent: '#10b981',
    gradient: 'linear-gradient(135deg, #022c22 0%, #047857 60%, #059669 100%)',
    glow: 'rgba(16, 185, 129, 0.25)',
    border: 'rgba(16, 185, 129, 0.3)',
    pillBg: 'rgba(16, 185, 129, 0.15)',
    pillColor: '#6ee7b7',
    emblem: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  ai: {
    name: 'AI & Data Science',
    accent: '#a855f7',
    gradient: 'linear-gradient(135deg, #2e1065 0%, #6d28d9 60%, #7c3aed 100%)',
    glow: 'rgba(168, 85, 247, 0.25)',
    border: 'rgba(168, 85, 247, 0.3)',
    pillBg: 'rgba(168, 85, 247, 0.15)',
    pillColor: '#d8b4fe',
    emblem: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
  },
  generic: {
    name: 'Core Curriculum',
    accent: '#6366f1',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #4f46e5 100%)',
    glow: 'rgba(99, 102, 241, 0.25)',
    border: 'rgba(99, 102, 241, 0.3)',
    pillBg: 'rgba(99, 102, 241, 0.15)',
    pillColor: '#a5b4fc',
    emblem: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
};

function getTechPreset(title = '') {
  const t = title.toLowerCase();
  if (t.includes('react')) return TECH_PRESETS.react;
  if (t.includes('angular')) return TECH_PRESETS.angular;
  if (t.includes('full') || t.includes('stack') || t.includes('node') || t.includes('backend'))
    return TECH_PRESETS.fullstack;
  if (t.includes('ai') || t.includes('python') || t.includes('data') || t.includes('machine'))
    return TECH_PRESETS.ai;
  return TECH_PRESETS.generic;
}

function getInitials(title = '') {
  return title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'CS';
}

/* ─── Level Badge ─── */
function LevelBadge({ level }) {
  const norm = (level || 'BEGINNER').toUpperCase();
  const map = {
    BEGINNER: { label: 'Beginner', bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: 'rgba(16, 185, 129, 0.35)' },
    INTERMEDIATE: { label: 'Intermediate', bg: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.35)' },
    ADVANCED: { label: 'Advanced', bg: 'rgba(168, 85, 247, 0.18)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.35)' },
  };
  const s = map[norm] || map.BEGINNER;
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        letterSpacing: '0.3px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  );
}

/* ─── Hero Spotlight Banner ─── */
function HeroSpotlightCard({ course, onContinue }) {
  if (!course) return null;
  const preset = getTechPreset(course.title);
  const progress = course.progressPercent ?? 0;
  const isCompleted = progress >= 100;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(20, 24, 38, 0.95) 0%, rgba(12, 14, 22, 0.98) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
        padding: '28px 32px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 320,
          height: 320,
          background: `radial-gradient(circle, ${preset.glow} 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Left Info Column */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 800,
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              letterSpacing: '0.5px',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
                animation: 'pulse 1.5s infinite',
              }}
            />
            {isCompleted ? 'CURRICULUM COMPLETED' : 'RESUME WHERE YOU LEFT OFF'}
          </span>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
              background: preset.pillBg,
              color: preset.pillColor,
              border: `1px solid ${preset.border}`,
            }}
          >
            {preset.name}
          </span>
        </div>

        <h2
          style={{
            margin: '0 0 8px',
            fontSize: 26,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.5px',
            lineHeight: 1.25,
          }}
        >
          {course.title}
        </h2>

        <p
          style={{
            margin: '0 0 16px',
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.75)',
            lineHeight: 1.6,
            maxWidth: 620,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.description ||
            'Master core concepts through interactive modules, practical evaluations, and certified instructor guidance.'}
        </p>

        {/* Quick Meta Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} className="text-blue-400" />
            {course.durationMinutes ? `${course.durationMinutes} min` : 'Self-paced'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={14} className="text-emerald-400" />
            {course.modulesCount ? `${course.modulesCount} Modules` : 'Full Curriculum'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={14} className="text-amber-400" />
            Certificate Eligible
          </span>
        </div>
      </div>

      {/* Right Progress & Action Hub */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 16,
          minWidth: 260,
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: '20px 24px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Completion Progress
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: isCompleted ? '#34d399' : '#fff' }}>
              {progress}%
            </span>
          </div>
          <div
            style={{
              height: 8,
              width: '100%',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 99,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, progress)}%`,
                background: isCompleted
                  ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                  : 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                borderRadius: 99,
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        <button
          onClick={() => onContinue(course)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: isCompleted
              ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
              : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            color: '#fff',
            boxShadow: '0 4px 18px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 18px rgba(37, 99, 235, 0.4)';
          }}
        >
          {isCompleted ? (
            <>
              <GraduationCap size={18} /> Review Material
            </>
          ) : progress > 0 ? (
            <>
              <Play size={16} fill="#fff" /> Continue Lesson
            </>
          ) : (
            <>
              Start Course <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Modern Grid Card ─── */
function CourseGridCard({ course, onContinue, isBookmarked, onToggleBookmark }) {
  const progress = course.progressPercent ?? 0;
  const isCompleted = progress >= 100;
  const preset = getTechPreset(course.title);
  const initials = getInitials(course.title);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
        e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.25)';
      }}
    >
      {/* Visual Header Banner */}
      <div
        style={{
          height: 140,
          background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : preset.gradient,
          position: 'relative',
          padding: '16px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          overflow: 'hidden',
        }}
      >
        {/* Subtle mesh overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Tech Emblem Background Graphic */}
        <div
          style={{
            position: 'absolute',
            right: 14,
            bottom: 10,
            opacity: 0.85,
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))',
          }}
        >
          {preset.emblem}
        </div>

        {/* Top Badges */}
        <div style={{ zIndex: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
          <LevelBadge level={course.level} />
          <span
            style={{
              padding: '3px 9px',
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              background: 'rgba(0,0,0,0.5)',
              color: '#f1f5f9',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {preset.name}
          </span>
        </div>

        {/* Bookmark Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(course.id);
          }}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark course'}
          style={{
            zIndex: 2,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isBookmarked ? '#fbbf24' : '#fff',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Star size={14} fill={isBookmarked ? '#fbbf24' : 'none'} />
        </button>

        {/* Logo Badge inside Banner */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 18,
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 16,
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 3,
          }}
        >
          {initials}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: 14 }}>
        <div>
          <h3
            style={{
              margin: '0 0 6px',
              fontSize: 18,
              fontWeight: 700,
              color: '#f8fafc',
              lineHeight: 1.3,
            }}
          >
            {course.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#94a3b8',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {course.description ||
              'Master essential industry concepts through structured lessons, assignments, and real-world project modules.'}
          </p>
        </div>

        {/* Metadata Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={13} /> {course.durationMinutes ? `${course.durationMinutes} min` : 'Self-paced'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Layers size={13} /> {course.modulesCount ? `${course.modulesCount} modules` : 'Curriculum'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981' }}>
            <Award size={13} /> Verified Cert
          </span>
        </div>

        {/* Gradient Progress Section */}
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            <span style={{ color: '#64748b' }}>Course Progress</span>
            <span style={{ color: isCompleted ? '#34d399' : '#f8fafc' }}>
              {isCompleted ? 'Completed' : `${progress}%`}
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, progress)}%`,
                background: isCompleted ? '#10b981' : 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                borderRadius: 99,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Footer: Instructor & CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 14,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <Avatar name={course.createdByName || 'Instructor'} size="xs" />
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {course.createdByName || 'Platform Faculty'}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: '#64748b' }}>Lead Instructor</p>
            </div>
          </div>

          <button
            onClick={() => onContinue(course)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: isCompleted
                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                : progress > 0
                ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
                : '#ffffff',
              color: isCompleted || progress > 0 ? '#fff' : '#09090b',
              boxShadow: progress > 0 ? '0 2px 10px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'opacity 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isCompleted ? (
              <>
                <GraduationCap size={15} /> Review
              </>
            ) : progress > 0 ? (
              <>
                <Play size={14} fill="#fff" /> Continue
              </>
            ) : (
              <>
                Start Course <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modern List Card (Directly addresses the user's uploaded screenshot) ─── */
function CourseListCard({ course, onContinue, isBookmarked, onToggleBookmark }) {
  const progress = course.progressPercent ?? 0;
  const isCompleted = progress >= 100;
  const preset = getTechPreset(course.title);
  const initials = getInitials(course.title);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 18,
        padding: '18px 24px',
        display: 'grid',
        gridTemplateColumns: '120px minmax(0, 1fr) 260px',
        gap: 24,
        alignItems: 'center',
        boxShadow: '0 4px 18px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.2)';
      }}
    >
      {/* Left Icon / Visual Thumbnail */}
      <div
        style={{
          width: 120,
          height: 100,
          borderRadius: 14,
          background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : preset.gradient,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>{preset.emblem}</div>
        <span
          style={{
            position: 'absolute',
            bottom: 6,
            fontSize: 10,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.5px',
          }}
        >
          {initials}
        </span>
      </div>

      {/* Middle Details Section */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <LevelBadge level={course.level} />
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              background: preset.pillBg,
              color: preset.pillColor,
              border: `1px solid ${preset.border}`,
            }}
          >
            {preset.name}
          </span>
          <span style={{ fontSize: 12, color: '#64748b' }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' }}>
            <Clock size={12} /> {course.durationMinutes ? `${course.durationMinutes} min` : 'Self-paced'}
          </span>
          <span style={{ fontSize: 12, color: '#64748b' }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#10b981' }}>
            <Award size={12} /> Certificate Eligible
          </span>
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: '#f8fafc',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {course.title}
        </h3>

        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: '#94a3b8',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.5,
          }}
        >
          {course.description ||
            'Master core concepts through interactive lessons, quizzes, and project-based evaluations.'}
        </p>

        {/* Instructor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Avatar name={course.createdByName || 'Instructor'} size="xs" />
          <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
            {course.createdByName || 'Platform Administrator'}
          </span>
          <span style={{ fontSize: 11, color: '#64748b' }}>(Instructor)</span>
        </div>
      </div>

      {/* Right Progress & Actions */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingLeft: 20,
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            <span style={{ color: '#64748b' }}>Course Progress</span>
            <span style={{ color: isCompleted ? '#34d399' : '#f8fafc' }}>
              {isCompleted ? 'Completed' : `${progress}%`}
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, progress)}%`,
                background: isCompleted ? '#10b981' : 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                borderRadius: 99,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => onContinue(course)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: isCompleted
                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                : progress > 0
                ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
                : '#ffffff',
              color: isCompleted || progress > 0 ? '#fff' : '#09090b',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isCompleted ? (
              <>
                <GraduationCap size={15} /> Review
              </>
            ) : progress > 0 ? (
              <>
                <Play size={14} fill="#fff" /> Continue
              </>
            ) : (
              <>
                Start Course <ArrowRight size={14} />
              </>
            )}
          </button>

          <button
            onClick={() => onToggleBookmark(course.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark course'}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isBookmarked ? '#fbbf24' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            <Star size={16} fill={isBookmarked ? '#fbbf24' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Right Sidebar Widgets (Fills Widescreen Space Perfectly) ─── */
function CourseSidebar({  navigate }) {
  const [downloadSuccess, setDownloadSuccess] = useState('');
  const [expandedToolkit, setExpandedToolkit] = useState(false);
  const { data: resources = [] } = useResources();

  const handleFakeDownload = (name) => {
    setDownloadSuccess(name);
    setTimeout(() => setDownloadSuccess(''), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Weekly Study Velocity Card */}
      <div
        style={{
          background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 18,
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(249, 115, 22, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb923c',
              }}
            >
              <Flame size={18} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>Learning Streak</h4>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>4 Days Consecutive</p>
            </div>
          </div>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
            }}
          >
            ACTIVE
          </span>
        </div>

        {/* Days Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginBottom: 16 }}>
          {[
            { day: 'M', active: true },
            { day: 'T', active: true },
            { day: 'W', active: true },
            { day: 'T', active: true },
            { day: 'F', active: false },
            { day: 'S', active: false },
            { day: 'S', active: false },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flex: 1,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: item.active ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'rgba(255,255,255,0.06)',
                  color: item.active ? '#fff' : '#64748b',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: item.active ? '0 2px 8px rgba(249, 115, 22, 0.4)' : 'none',
                }}
              >
                {item.day}
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Goal Gauge */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
            <span style={{ color: '#94a3b8' }}>Weekly Target: 4.5h / 6.0h</span>
            <span style={{ color: '#38bdf8' }}>75%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '75%', background: '#38bdf8', borderRadius: 99 }} />
          </div>
        </div>
      </div>

      {/* Verified Certificates Spotlight */}
      <div
        style={{
          background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 18,
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}
          >
            <Award size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>Official Certificates</h4>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Earn verifiable credentials</p>
          </div>
        </div>

        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
          Pass all module evaluations with &ge; 70% to automatically receive encrypted, blockchain-backed certificates.
        </p>

        <button
          onClick={() => navigate(ROUTES.CERTIFICATES)}
          style={{
            width: '100%',
            padding: '9px 14px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)')}
        >
          View Certificates Hub <ArrowRight size={13} />
        </button>
      </div>

      {/* Quick Downloadable Study Toolkit */}
      <div
        style={{
          background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 18,
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            <Download size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>Study Toolkit</h4>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>1-Click Reference Guides</p>
          </div>
        </div>

        {downloadSuccess && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={12} /> Downloaded {downloadSuccess}!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {resources.length === 0 ? (
            <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>No guides uploaded yet.</p>
          ) : (
            <>
              {(expandedToolkit ? resources : resources.slice(0, 5)).map((kit) => {
                const isNew = kit.createdAt && (Date.now() - new Date(kit.createdAt).getTime() < 7 * 24 * 3600 * 1000);
                const fileTypeUpper = (kit.fileType || 'PDF').toUpperCase();
                const badgeColor =
                  fileTypeUpper === 'DOCX' || fileTypeUpper === 'DOC'
                    ? { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' }
                    : fileTypeUpper === 'ZIP' || fileTypeUpper === 'RAR'
                    ? { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' }
                    : { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };

                return (
                  <div
                    key={kit.id}
                    onClick={() => {
                      resourceService.downloadFile(kit);
                      handleFakeDownload(kit.title);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: badgeColor.bg,
                            color: badgeColor.text,
                            border: `1px solid ${badgeColor.border}`,
                          }}
                        >
                          {fileTypeUpper}
                        </span>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {kit.title}
                        </p>
                        {isNew && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: 99,
                              background: 'rgba(249, 115, 22, 0.2)',
                              color: '#fb923c',
                              border: '1px solid rgba(249, 115, 22, 0.4)',
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 10, color: '#64748b' }}>{kit.fileSize} • by {kit.authorRole || 'Faculty'}</p>
                    </div>
                    <Download size={14} color="#38bdf8" />
                  </div>
                );
              })}

              {resources.length > 5 && (
                <button
                  onClick={() => setExpandedToolkit((prev) => !prev)}
                  style={{
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {expandedToolkit ? 'Show Less' : `View All (${resources.length}) Guides`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page Component ─── */
export const MyCoursesPage = () => {
  const navigate = useNavigate();
  // Persistent view preference: default 'grid'
  const [view, setView] = useState(() => localStorage.getItem('lms_course_view') || 'grid');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'SAVED'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [categoryOpen, setCategoryOpen] = useState(false);

  // Bookmarks in localStorage
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lms_bookmarked_courses') || '[]');
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('lms_bookmarked_courses', JSON.stringify(next));
      return next;
    });
  };

  const handleSetView = (v) => {
    setView(v);
    localStorage.setItem('lms_course_view', v);
  };

  const { data, isLoading, error, refetch } = useMyCourses();
  const courses = useMemo(() => {
    const raw =
      data?.content ??
      data?.data?.content ??
      data?.items ??
      data?.data ??
      data ??
      [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  // Derived metrics
  const completedCount = useMemo(
    () => courses.filter((c) => (c.progressPercent || 0) >= 100).length,
    [courses]
  );
  const inProgressCount = useMemo(
    () => courses.filter((c) => (c.progressPercent || 0) > 0 && (c.progressPercent || 0) < 100).length,
    [courses]
  );
  const savedCount = useMemo(
    () => courses.filter((c) => bookmarks.includes(c.id)).length,
    [courses, bookmarks]
  );

  // Pick top course for Hero Spotlight
  const topCourse = useMemo(() => {
    if (!courses.length) return null;
    const inProg = courses.find((c) => (c.progressPercent || 0) > 0 && (c.progressPercent || 0) < 100);
    return inProg || courses[0];
  }, [courses]);

  // Filter categories
  const categories = useMemo(() => {
    const levels = [...new Set(courses.map((c) => c.level).filter(Boolean))];
    return ['All Categories', ...levels.map((l) => l.charAt(0) + l.slice(1).toLowerCase())];
  }, [courses]);

  // Combined Filtering
  const filtered = useMemo(() => {
    return courses.filter((c) => {
      // Tab filter
      const p = c.progressPercent || 0;
      if (activeTab === 'IN_PROGRESS' && (p === 0 || p >= 100)) return false;
      if (activeTab === 'COMPLETED' && p < 100) return false;
      if (activeTab === 'SAVED' && !bookmarks.includes(c.id)) return false;

      // Category filter
      if (
        categoryFilter !== 'All Categories' &&
        c.level?.toLowerCase() !== categoryFilter.toLowerCase()
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title?.toLowerCase().includes(q);
        const matchesDesc = c.description?.toLowerCase().includes(q);
        const matchesInstructor = c.createdByName?.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesInstructor;
      }

      return true;
    });
  }, [courses, activeTab, categoryFilter, searchQuery, bookmarks]);

  const handleContinue = (course) => {
    navigate(ROUTES.LEARNING(course.id));
  };

  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        paddingBottom: 48,
      }}
    >
      {/* ── Page Header & Stats Ribbon ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#38bdf8',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Academic Curriculum
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.5px',
            }}
          >
            My Courses
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#94a3b8' }}>
            Pick up right where you left off, review lessons, and earn certified credentials.
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
                ENROLLED
              </p>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>{courses.length}</h4>
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(251, 146, 60, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb923c',
              }}
            >
              <Play size={16} fill="#fb923c" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
                IN PROGRESS
              </p>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>{inProgressCount}</h4>
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <Award size={18} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
                COMPLETED
              </p>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>{completedCount}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* ── Spotlight Hero Card: Resume Learning ── */}
      {topCourse && !isLoading && !error && (
        <HeroSpotlightCard course={topCourse} onContinue={handleContinue} />
      )}

      {/* ── Main Layout: Content Grid + Interactive Sidebar ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 28,
          alignItems: 'start',
        }}
      >
        {/* Left Section (Courses + Controls) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Filter & Search Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
              background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '12px 18px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
          >
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All Courses (${courses.length})` },
                { id: 'IN_PROGRESS', label: `In Progress (${inProgressCount})` },
                { id: 'COMPLETED', label: `Completed (${completedCount})` },
                { id: 'SAVED', label: `Saved (${savedCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    background: activeTab === tab.id ? '#2563eb' : 'transparent',
                    color: activeTab === tab.id ? '#fff' : '#94a3b8',
                    boxShadow: activeTab === tab.id ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & View Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, color: '#64748b' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    padding: '8px 12px 8px 34px',
                    fontSize: 13,
                    color: '#fff',
                    outline: 'none',
                    width: 170,
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: 8,
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Level Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setCategoryOpen((o) => !o)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#cbd5e1',
                  }}
                >
                  <Filter size={13} />
                  {categoryFilter}
                  <ChevronDown size={13} />
                </button>
                {categoryOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 42,
                      right: 0,
                      zIndex: 50,
                      minWidth: 160,
                      background: '#1a1e2a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      padding: '6px 0',
                      overflow: 'hidden',
                    }}
                  >
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setCategoryFilter(cat);
                          setCategoryOpen(false);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 16px',
                          fontSize: 13,
                          border: 'none',
                          cursor: 'pointer',
                          background: cat === categoryFilter ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                          color: cat === categoryFilter ? '#38bdf8' : '#cbd5e1',
                          fontWeight: cat === categoryFilter ? 700 : 500,
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Toggle (Grid / List) */}
              <div
                style={{
                  display: 'flex',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <button
                  onClick={() => handleSetView('grid')}
                  title="Grid view"
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: view === 'grid' ? '#2563eb' : 'transparent',
                    color: view === 'grid' ? '#fff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => handleSetView('list')}
                  title="List view"
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: view === 'list' ? '#2563eb' : 'transparent',
                    color: view === 'list' ? '#fff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <LayoutList size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Error Notification */}
          {error && (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 14,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Failed to load courses from workspace catalog.</span>
              <button
                onClick={refetch}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Course Listings */}
          {isLoading ? (
            <div
              style={{
                display: 'grid',
                gap: 20,
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 340,
                    background: '#161922',
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.06)',
                    animation: 'pulse 1.4s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          ) : !error && filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
                borderRadius: 20,
                border: '1px dashed rgba(255, 255, 255, 0.12)',
              }}
            >
              <BookOpen size={44} style={{ color: '#64748b', margin: '0 auto 16px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                No courses found
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: '#94a3b8' }}>
                {searchQuery
                  ? `No enrolled courses match "${searchQuery}".`
                  : activeTab === 'SAVED'
                  ? 'You have not bookmarked any courses yet. Click the star icon to save courses.'
                  : activeTab !== 'ALL'
                  ? `No courses currently match the "${activeTab}" filter.`
                  : 'You are currently not enrolled into any courses.'}
              </p>
              {(searchQuery || activeTab !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTab('ALL');
                    setCategoryFilter('All Categories');
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : view === 'grid' ? (
            <div
              style={{
                display: 'grid',
                gap: 22,
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              }}
            >
              {filtered.map((course) => (
                <CourseGridCard
                  key={course.id}
                  course={course}
                  onContinue={handleContinue}
                  isBookmarked={bookmarks.includes(course.id)}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map((course) => (
                <CourseListCard
                  key={course.id}
                  course={course}
                  onContinue={handleContinue}
                  isBookmarked={bookmarks.includes(course.id)}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Velocity, Milestones & Toolkit */}
        <CourseSidebar courses={courses} navigate={navigate} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
};

export default MyCoursesPage;
