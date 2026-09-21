import React from 'react';
import { X, Award, CheckCircle2, Users, Sparkles } from 'lucide-react';
import { BADGE_TIERS } from '../utils/badgeDefinitions';

export const BadgeDetailModal = ({ badge, onClose, studentsWithBadge = [] }) => {
  if (!badge) return null;

  const tier = badge.tier || BADGE_TIERS.SKILLED;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--card-bg, #18181b)',
          borderRadius: 20,
          border: `1.5px solid ${tier.accentColor}`,
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px ${tier.glowColor}`,
          overflow: 'hidden',
          position: 'relative',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div
          style={{
            height: 120,
            background: tier.bgGradient,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'rgba(0,0,0,0.3)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.3)')}
          >
            <X size={18} />
          </button>

          {/* Glowing central badge crest */}
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 22,
              background: 'rgba(0,0,0,0.4)',
              border: `2px solid ${tier.accentColor}`,
              boxShadow: `0 10px 30px ${tier.glowColor}, inset 0 2px 4px rgba(255,255,255,0.4)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              transform: 'translateY(24px)',
            }}
          >
            {badge.glyph}
          </div>
        </div>

        {/* Content body */}
        <div style={{ padding: '36px 24px 24px', textAlign: 'center' }}>
          {/* Tier chip */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              background: `${tier.accentColor}20`,
              color: tier.accentColor,
              border: `1px solid ${tier.accentColor}50`,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            <Sparkles size={13} />
            {tier.label} Tier • {badge.rarity || 'Distinction'}
          </div>

          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary, #fff)',
              margin: '6px 0 10px',
            }}
          >
            {badge.title}
          </h2>

          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary, #a1a1aa)',
              lineHeight: 1.5,
              margin: '0 0 20px',
            }}
          >
            {badge.description}
          </p>

          {/* Unlock Criteria Box */}
          <div
            style={{
              textAlign: 'left',
              background: 'var(--bg-secondary, #27272a)',
              borderRadius: 12,
              padding: 14,
              border: '1px solid var(--border-color, #3f3f46)',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted, #71717a)',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              <CheckCircle2 size={14} color={tier.accentColor} />
              Unlock Requirement
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary, #fff)', fontWeight: 500 }}>
              {badge.criteria}
            </div>
          </div>

          {/* Achievers list */}
          {studentsWithBadge.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted, #71717a)',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                <Users size={14} /> Claimed By ({studentsWithBadge.length})
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  maxHeight: 110,
                  overflowY: 'auto',
                }}
              >
                {studentsWithBadge.map((s, idx) => (
                  <div
                    key={s.studentId || idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'var(--bg-tertiary, #27272a)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--text-primary, #fff)',
                      border: '1px solid var(--border-color, #3f3f46)',
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: tier.accentColor,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {(s.studentName || 'S').charAt(0).toUpperCase()}
                    </span>
                    <span>{s.studentName || 'Student'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted, #71717a)' }}>
                      #{s.rank || idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: tier.bgGradient,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${tier.glowColor}`,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadgeDetailModal;
