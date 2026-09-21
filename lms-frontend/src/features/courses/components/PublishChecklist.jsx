import { useState, useMemo } from 'react';
import {
  CheckCircle2, AlertCircle, AlertTriangle, Layers, FileText,
  Image, Clock, BookOpen, Shield, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import Button from '../../../components/common/Button';

/**
 * Pre-Publish Checklist component
 * Validates course readiness and shows a "readiness score" dial.
 * 
 * Rules:
 *   BLOCKERS (must fix to publish):
 *     - At least 1 section exists
 *     - At least 1 lesson exists across all sections
 *     - Course title is set
 *     - Course description is at least 200 characters
 * 
 *   WARNINGS (recommended but not blocking):
 *     - Course thumbnail/summary is set
 *     - At least 30 minutes of estimated duration
 *     - All sections have at least 1 lesson
 *     - No empty lesson titles
 *     - Category is set
 */

const BLOCKER = 'blocker';
const WARNING = 'warning';

function runChecks(course, modules) {
  const checks = [];
  const totalLessons = (modules || []).reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const totalDuration = (modules || []).reduce(
    (sum, m) => sum + (m.lessons || []).reduce((ls, l) => ls + (l.durationMinutes || 0), 0), 0
  );
  const emptySections = (modules || []).filter(m => !m.lessons || m.lessons.length === 0);

  // ── BLOCKERS ──
  checks.push({
    id: 'has-title',
    type: BLOCKER,
    label: 'Course has a title',
    passed: !!(course?.title && course.title.trim().length > 0),
    icon: BookOpen,
  });

  checks.push({
    id: 'has-description',
    type: BLOCKER,
    label: 'Description is at least 200 characters',
    detail: course?.description
      ? `${course.description.length} / 200 characters`
      : '0 / 200 characters',
    passed: !!(course?.description && course.description.length >= 200),
    icon: FileText,
  });

  checks.push({
    id: 'has-sections',
    type: BLOCKER,
    label: 'At least 1 section exists',
    detail: `${(modules || []).length} section(s) found`,
    passed: (modules || []).length > 0,
    icon: Layers,
  });

  checks.push({
    id: 'has-lessons',
    type: BLOCKER,
    label: 'At least 1 lesson exists',
    detail: `${totalLessons} lesson(s) across all sections`,
    passed: totalLessons > 0,
    icon: FileText,
  });

  // ── WARNINGS ──
  checks.push({
    id: 'has-summary',
    type: WARNING,
    label: 'Short summary is provided',
    detail: course?.summary ? `${course.summary.length} characters` : 'Not set',
    passed: !!(course?.summary && course.summary.trim().length > 10),
    icon: BookOpen,
  });

  checks.push({
    id: 'min-duration',
    type: WARNING,
    label: 'Total duration is at least 30 minutes',
    detail: `${totalDuration} minutes of content`,
    passed: totalDuration >= 30,
    icon: Clock,
  });

  checks.push({
    id: 'no-empty-sections',
    type: WARNING,
    label: 'All sections have at least 1 lesson',
    detail: emptySections.length > 0
      ? `${emptySections.length} empty section(s): ${emptySections.map(s => s.title || 'Untitled').join(', ')}`
      : 'All sections have content',
    passed: emptySections.length === 0,
    icon: Layers,
  });

  checks.push({
    id: 'has-category',
    type: WARNING,
    label: 'Category is assigned',
    passed: !!(course?.categoryId),
    icon: Shield,
  });

  checks.push({
    id: 'has-level',
    type: WARNING,
    label: 'Skill level is set',
    passed: !!(course?.level && course.level !== ''),
    icon: Sparkles,
  });

  return checks;
}

function computeScore(checks) {
  const total = checks.length;
  const passed = checks.filter(c => c.passed).length;
  return Math.round((passed / total) * 100);
}

// ── Readiness Score Ring ──
const ScoreRing = ({ score }) => {
  const size = 90;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="var(--border-color, #e5e7eb)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        style={{ fontSize: 22, fontWeight: 700, fill: color }}
      >
        {score}%
      </text>
    </svg>
  );
};

export const PublishChecklist = ({ course, modules, onPublish }) => {
  const [expanded, setExpanded] = useState(true);
  const checks = useMemo(() => runChecks(course, modules), [course, modules]);
  const score = useMemo(() => computeScore(checks), [checks]);

  const blockers = checks.filter(c => c.type === BLOCKER);
  const warnings = checks.filter(c => c.type === WARNING);
  const hasBlockers = blockers.some(c => !c.passed);
  const failedBlockers = blockers.filter(c => !c.passed).length;
  const failedWarnings = warnings.filter(c => !c.passed).length;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={headerStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={18} style={{ color: hasBlockers ? '#ef4444' : '#10b981' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Publish Readiness
          </span>
          {failedBlockers > 0 && (
            <span style={blockerBadge}>{failedBlockers} blocker{failedBlockers > 1 ? 's' : ''}</span>
          )}
          {failedWarnings > 0 && (
            <span style={warningBadge}>{failedWarnings} warning{failedWarnings > 1 ? 's' : ''}</span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div style={bodyStyle}>
          {/* Score Ring */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 16px' }}>
            <ScoreRing score={score} />
          </div>

          {/* Blockers */}
          {blockers.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={sectionLabelStyle}>
                <AlertCircle size={13} style={{ color: '#ef4444' }} /> Must Fix
              </p>
              {blockers.map(check => (
                <CheckItem key={check.id} check={check} />
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={sectionLabelStyle}>
                <AlertTriangle size={13} style={{ color: '#f59e0b' }} /> Recommended
              </p>
              {warnings.map(check => (
                <CheckItem key={check.id} check={check} />
              ))}
            </div>
          )}

          {/* Publish Button */}
          {onPublish && (
            <Button
              variant="primary"
              onClick={onPublish}
              disabled={hasBlockers}
              style={{ width: '100%', marginTop: 4 }}
            >
              {hasBlockers ? '⛔ Fix Blockers to Publish' : '🚀 Publish Course'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const CheckItem = ({ check }) => {
  const Icon = check.icon || FileText;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0',
      fontSize: 13, color: check.passed ? 'var(--text-muted)' : 'var(--text-primary)'
    }}>
      {check.passed ? (
        <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
      ) : check.type === BLOCKER ? (
        <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
      ) : (
        <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
      )}
      <div>
        <span style={{
          fontWeight: check.passed ? 400 : 600,
          textDecoration: check.passed ? 'line-through' : 'none',
          opacity: check.passed ? 0.6 : 1
        }}>
          {check.label}
        </span>
        {check.detail && !check.passed && (
          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            {check.detail}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Styles ──
const containerStyle = {
  background: 'var(--lms-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const headerStyle = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 18px',
  background: 'var(--surface-medium)',
  border: 'none',
  borderBottom: '1px solid var(--border-color)',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
};

const bodyStyle = {
  padding: '16px 18px',
};

const sectionLabelStyle = {
  margin: '0 0 8px',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const blockerBadge = {
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 12,
  background: 'rgba(239, 68, 68, 0.12)',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.25)',
};

const warningBadge = {
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 12,
  background: 'rgba(245, 158, 11, 0.12)',
  color: '#f59e0b',
  border: '1px solid rgba(245, 158, 11, 0.25)',
};

export default PublishChecklist;
