import React from 'react';
import { BADGE_TIERS } from '../utils/badgeDefinitions';

/**
 * LeetCode-style 3D/Metallic Badge component with glowing aura and rarity tiers.
 * Sizes: 'xs' (inline chip), 'sm' (compact), 'md' (standard), 'lg' (podium showcase)
 */
export const LeetCodeBadge = ({
  badge,
  size = 'sm',
  showTitle = true,
  interactive = true,
  onClick,
  style = {},
  className = '',
}) => {
  if (!badge) return null;

  const tier = badge.tier || BADGE_TIERS.SKILLED;

  // Sizing tokens
  const sizeConfig = {
    xs: {
      padding: '2px 8px',
      fontSize: 11,
      glyphSize: 13,
      borderRadius: 6,
      borderWidth: 1,
      gap: 5,
    },
    sm: {
      padding: '4px 10px',
      fontSize: 12,
      glyphSize: 15,
      borderRadius: 8,
      borderWidth: 1,
      gap: 6,
    },
    md: {
      padding: '8px 14px',
      fontSize: 13,
      glyphSize: 18,
      borderRadius: 10,
      borderWidth: 1.5,
      gap: 8,
    },
    lg: {
      padding: '16px 20px',
      fontSize: 15,
      glyphSize: 32,
      borderRadius: 14,
      borderWidth: 2,
      gap: 12,
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.sm;

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      title={`${badge.title} (${tier.label}) - ${badge.criteria}`}
      onClick={(e) => {
        if (interactive && onClick) {
          e.stopPropagation();
          onClick(badge);
        }
      }}
      onKeyDown={(e) => {
        if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          e.stopPropagation();
          onClick(badge);
        }
      }}
      className={`leetcode-badge leetcode-badge-${tier.key} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: currentSize.gap,
        padding: currentSize.padding,
        borderRadius: currentSize.borderRadius,
        background: tier.bgGradient,
        color: tier.textColor,
        border: `${currentSize.borderWidth}px solid ${tier.accentColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        fontSize: currentSize.fontSize,
        fontWeight: 600,
        letterSpacing: '0.01em',
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.25)';
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.18)';
        }
      }}
    >
      {/* Glyph icon / emoji */}
      <span
        style={{
          fontSize: currentSize.glyphSize,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.5))`,
        }}
      >
        {badge.glyph}
      </span>

      {/* Badge title / label */}
      {showTitle && (
        <span
          style={{
            whiteSpace: 'nowrap',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          {size === 'xs' ? badge.shortTitle || badge.title : badge.title}
        </span>
      )}
    </div>
  );
};

export default LeetCodeBadge;
