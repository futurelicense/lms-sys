import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, BookOpen, Plus, Globe, GlobeLock, Archive,
  CheckCircle, XCircle, Trash2, LayoutList, LayoutGrid, Copy,
  Clock, Layers, Award, Sparkles, ArrowRight
} from 'lucide-react';
import AdminButton from '../../../components/ui/AdminButton';
import { AdminModal, AdminConfirmModal } from '../../../components/ui/AdminModal';
import AdminPagination, { AdminEmptyState, AdminErrorState } from '../../../components/ui/AdminPagination';
import PermissionGuard from '../../../guards/PermissionGuard';
import { PERMISSIONS } from '../../../constants/permissions';
import { COURSE_STATUS } from '../constants/courseConstants';
import { ROUTES } from '../../../constants/routes';
import courseService from '../services/courseService';
import { useToast } from '../../../components/feedback/Toast';

/* ─── Tech Visual Presets & SVG Emblems (aligned with Student Panel & Admin) ─── */
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
  java: {
    name: 'Java & Algorithms',
    accent: '#f97316',
    gradient: 'linear-gradient(135deg, #431407 0%, #c2410c 60%, #ea580c 100%)',
    glow: 'rgba(249, 115, 22, 0.25)',
    border: 'rgba(249, 115, 22, 0.3)',
    pillBg: 'rgba(249, 115, 22, 0.15)',
    pillColor: '#fdba74',
    emblem: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  cloud: {
    name: 'Cloud & DevOps',
    accent: '#06b6d4',
    gradient: 'linear-gradient(135deg, #083344 0%, #0e7490 60%, #06b6d4 100%)',
    glow: 'rgba(6, 182, 212, 0.25)',
    border: 'rgba(6, 182, 212, 0.3)',
    pillBg: 'rgba(6, 182, 212, 0.15)',
    pillColor: '#67e8f9',
    emblem: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
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
  if (t.includes('java') || t.includes('structure') || t.includes('dsa') || t.includes('algorithm')) return TECH_PRESETS.java;
  if (t.includes('cloud') || t.includes('devops') || t.includes('aws') || t.includes('docker') || t.includes('kubernetes')) return TECH_PRESETS.cloud;
  if (t.includes('ai') || t.includes('python') || t.includes('data') || t.includes('machine') || t.includes('learning')) return TECH_PRESETS.ai;
  if (t.includes('full') || t.includes('stack') || t.includes('node') || t.includes('backend') || t.includes('web')) return TECH_PRESETS.fullstack;
  return TECH_PRESETS.generic;
}

function getInitials(str = '') {
  return str.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'CS';
}

/* ── Level Badge ── */
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
        gap: 5,
        backdropFilter: 'blur(4px)',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
      {s.label}
    </span>
  );
}

/* ── Status Pill ── */
const SC = {
  DRAFT: { label: 'Draft', bg: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', border: 'rgba(255, 255, 255, 0.15)' },
  PENDING_REVIEW: { label: 'Pending', bg: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)' },
  PUBLISHED: { label: 'Ongoing', bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: 'rgba(16, 185, 129, 0.35)' },
  UNPUBLISHED: { label: 'Unpublished', bg: 'rgba(148, 163, 184, 0.18)', color: '#cbd5e1', border: 'rgba(148, 163, 184, 0.35)' },
  ARCHIVED: { label: 'Archived', bg: 'rgba(100, 116, 139, 0.18)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.35)' },
};

function StatusPill({ status }) {
  const c = SC[status] ?? SC.DRAFT;
  return (
    <span style={{
      padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      backdropFilter: 'blur(8px)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
      {c.label}
    </span>
  );
}

/* ── Avatar ── */
function Avatar({ name = '', size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, fontFamily: 'system-ui, -apple-system, sans-serif',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)'
    }}>
      {getInitials(name)}
    </div>
  );
}

/* ── Action Builder ── */
function buildActions(course, onAction) {
  const s = course.status, A = [];
  if (s === 'PENDING_REVIEW') {
    A.push({ label: 'Approve', danger: false, onClick: () => onAction('approve', course) });
  }
  if (s === 'DRAFT' || s === 'UNPUBLISHED')
    A.push({ label: 'Publish', danger: false, onClick: () => onAction('publish', course) });
  if (s === 'PUBLISHED')
    A.push({ label: 'Unpublish', danger: false, onClick: () => onAction('unpublish', course) });
  if (s === 'PUBLISHED' || s === 'UNPUBLISHED')
    A.push({ label: 'Archive', danger: true, onClick: () => onAction('archive', course) });
  if (s === 'DRAFT')
    A.push({ label: 'Delete', danger: true, onClick: () => onAction('delete', course) });
  return A;
}

/* ── Course Card (Matching Admin Implementation) ── */
function CourseCard({ course, onAction, onClick }) {
  const actions = buildActions(course, onAction);
  const primary = actions[0] ?? null;
  const enroll = course.enrollmentCount ?? 0;
  const preset = getTechPreset(course.title);
  const initials = getInitials(course.title);

  return (
    <div
      onClick={onClick}
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
        cursor: 'pointer',
        width: '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
        e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.45)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.25)';
      }}
    >
      {/* Visual Header Banner */}
      <div
        style={{
          height: 135,
          background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : preset.gradient,
          position: 'relative',
          padding: '14px 16px',
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
            bottom: 8,
            opacity: 0.85,
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))',
            pointerEvents: 'none',
          }}
        >
          {preset.emblem}
        </div>

        {/* Top Badges */}
        <div style={{ zIndex: 2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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

        {/* Top-Right Status Pill */}
        <div style={{ zIndex: 2 }}>
          <StatusPill status={course.status} />
        </div>

        {/* Logo Monogram inside Banner */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 15,
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 3,
          }}
        >
          {initials}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: 14 }}>
        <div>
          <h3
            style={{
              margin: '0 0 6px',
              fontSize: 17,
              fontWeight: 700,
              color: '#f8fafc',
              lineHeight: 1.35,
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
            {course.description || 'Comprehensive curriculum covering practical implementation, workflows, and core architecture.'}
          </p>
        </div>

        {/* Stats strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: 12,
            color: '#cbd5e1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={14} style={{ color: preset.accent }} />
            <span>{course.modulesCount ?? 4} Modules</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} style={{ color: preset.accent }} />
            <span>{course.durationHours ? `${course.durationHours}h` : '40h'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <Award size={14} style={{ color: '#10b981' }} />
            <span>{enroll} Enrolled</span>
          </div>
        </div>

        {/* Footer with Instructor & Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: 14,
            marginTop: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Avatar name={course.createdByName ?? 'Instructor'} size={28} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#e2e8f0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {course.createdByName ?? 'Teaching Faculty'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onAction('edit', course)}
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
            >
              Edit
            </button>

            {primary && (
              <button
                onClick={primary.onClick}
                style={{
                  padding: '6px 14px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 700,
                  border: primary.danger ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                  background: primary.danger ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                  color: primary.danger ? '#f87171' : '#fff',
                  cursor: 'pointer',
                  boxShadow: primary.danger ? 'none' : '0 2px 10px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {primary.label}
              </button>
            )}

            <button
              onClick={() => onAction('duplicate', course)}
              title="Duplicate course"
              style={{
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'transparent',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Copy size={15} />
            </button>

            <button
              onClick={() => onAction('delete', course)}
              title="Delete course"
              style={{
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modern List Row ── */
function CourseListRow({ course, onAction, onClick }) {
  const actions = buildActions(course, onAction);
  const primary = actions[0];
  const preset = getTechPreset(course.title);
  const initials = getInitials(course.title);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'linear-gradient(180deg, #161922 0%, #11131a 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        gap: 16,
        cursor: 'pointer',
        boxShadow: '0 4px 18px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.2)';
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: preset.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 15,
          color: '#fff',
          flexShrink: 0,
          boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
        }}
      >
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>{course.title}</span>
          <LevelBadge level={course.level} />
          <StatusPill status={course.status} />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {course.description || preset.name}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 16 }}>
        <Avatar name={course.createdByName ?? 'Instructor'} size={32} />
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{course.createdByName ?? 'Teaching Faculty'}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Instructor</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 16, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onAction('edit', course)}
          style={{
            padding: '7px 16px',
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#f8fafc',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
        >
          Edit
        </button>

        {primary && (
          <button
            onClick={primary.onClick}
            style={{
              padding: '7px 16px',
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 700,
              border: primary.danger ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
              background: primary.danger ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              color: primary.danger ? '#f87171' : '#fff',
              cursor: 'pointer',
              boxShadow: primary.danger ? 'none' : '0 2px 10px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            {primary.label}
          </button>
        )}

        <button
          onClick={() => onAction('duplicate', course)}
          title="Duplicate course"
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'transparent',
            color: '#cbd5e1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Copy size={16} />
        </button>

        <button
          onClick={() => onAction('delete', course)}
          title="Delete course"
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  const s = { background: 'rgba(255, 255, 255, 0.08)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' };
  return (
    <div style={{ background: '#161922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ ...s, height: 135, borderRadius: 0 }} />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ ...s, height: 20, width: '70%' }} />
        <div style={{ ...s, height: 14, width: '90%' }} />
        <div style={{ ...s, height: 6, borderRadius: 99, marginTop: 10 }} />
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ ...s, width: 32, height: 32, borderRadius: '50%' }} />
            <div style={{ ...s, height: 14, width: 80 }} />
          </div>
          <div style={{ ...s, width: 64, height: 28, borderRadius: 99 }} />
        </div>
      </div>
    </div>
  );
}

const STATUS_FILTERS = ['ALL', ...Object.values(COURSE_STATUS)];

export const CourseListPage = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [view, setView] = useState('grid');
  const [confirmAction, setConfirmAction] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const res = await courseService.list({
        page,
        size: pageSize,
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      const data = res?.data ?? res;
      setCourses(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) { setLoadError(err?.message ?? 'Failed to load courses.'); }
    finally { setLoading(false); }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const doAction = async (course, type, fn, msg) => {
    setConfirmAction(a => ({ ...a, loading: true }));
    try {
      if (type === 'delete' && course.status === 'PUBLISHED') {
        await courseService.unpublish(course.id);
      }
      await fn(course.id);
      toastSuccess(msg);
      setConfirmAction(null);
      load();
    }
    catch (err) {
      toastError(err?.response?.data?.message ?? err?.message ?? 'Failed.');
      setConfirmAction(a => ({ ...a, loading: false }));
    }
  };

  const handleAction = (type, course) => {
    if (type === 'edit') { navigate(ROUTES.COURSE_EDIT(course.id)); return; }
    if (type === 'duplicate') {
      doAction(course, 'duplicate', courseService.duplicate, `"${course.title}" duplicated into DRAFT!`);
      return;
    }
    const MAP = {
      publish: { fn: courseService.publish, msg: 'Published!' },
      unpublish: { fn: courseService.unpublish, msg: 'Unpublished.' },
      archive: { fn: courseService.archive, msg: 'Archived.' },
      delete: { fn: courseService.remove, msg: 'Deleted.' },
    };
    if (MAP[type]) setConfirmAction({ course, action: type, loading: false, fn: () => doAction(course, type, MAP[type].fn, MAP[type].msg) });
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header matching Admin implementation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Courses
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            Create, review and publish learning content.
          </p>
        </div>
        <PermissionGuard required={[PERMISSIONS.COURSE_CREATE]} fallback={null}>
          <AdminButton icon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.COURSE_CREATE)}>
            New Course
          </AdminButton>
        </PermissionGuard>
      </div>

      {/* Filter Bar matching Admin implementation */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(22, 25, 34, 0.9) 0%, rgba(17, 19, 26, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (setPage(0), setSearch(searchInput))}
              placeholder="Search courses…"
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(0, 0, 0, 0.35)',
                color: '#f8fafc',
                fontSize: 14,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(s => {
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => { setPage(0); setStatusFilter(s); }}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: active ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.04)',
                    color: active ? '#ffffff' : '#94a3b8',
                    border: active ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: active ? '0 2px 12px rgba(37, 99, 235, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
                >
                  {s === 'ALL' ? 'All' : SC[s]?.label ?? s}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 10, overflow: 'hidden', marginLeft: 'auto', background: 'rgba(0,0,0,0.2)' }}>
            {[{ id: 'list', I: LayoutList }, { id: 'grid', I: LayoutGrid }].map(({ id, I }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  background: view === id ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: view === id ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s',
                }}
              >
                <I size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : loadError ? (
        <div style={{ padding: 32, textAlign: 'center', background: 'var(--lms-card)', borderRadius: 12, border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          {loadError} <button onClick={load} style={{ color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
        </div>
      ) : courses.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: 'var(--lms-card)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 18 }}>No courses found</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>{search || statusFilter !== 'ALL' ? 'Try adjusting your search or filter.' : 'Create your first course to get started.'}</p>
        </div>
      ) : view === 'grid' ? (
        <>
          <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {courses.map(c => (
              <CourseCard
                key={c.id}
                course={c}
                onAction={handleAction}
                onClick={() => navigate(ROUTES.COURSE_DETAILS(c.id))}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ marginTop: 24 }}>
              <AdminPagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {courses.map(c => (
              <CourseListRow
                key={c.id}
                course={c}
                onAction={handleAction}
                onClick={() => navigate(ROUTES.COURSE_DETAILS(c.id))}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ marginTop: 24 }}>
              <AdminPagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <AdminConfirmModal
          open
          title={`${confirmAction.action[0].toUpperCase() + confirmAction.action.slice(1)} Course`}
          description={
            confirmAction.action === 'delete' && confirmAction.course.status === 'PUBLISHED'
              ? `"${confirmAction.course.title}" is currently PUBLISHED. To safely delete it, it will be unpublished first and then permanently removed. Are you sure?`
              : `Are you sure you want to ${confirmAction.action} "${confirmAction.course.title}"?`
          }
          confirmLabel={confirmAction.action[0].toUpperCase() + confirmAction.action.slice(1)}
          danger={['delete', 'archive'].includes(confirmAction.action)}
          loading={confirmAction.loading}
          onConfirm={confirmAction.fn}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
};

export default CourseListPage;
