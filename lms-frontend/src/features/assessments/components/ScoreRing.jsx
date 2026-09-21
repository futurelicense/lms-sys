/**
 * Circular score/progress ring.
 * Uses SVG stroke-dasharray for a clean donut chart effect.
 *
 * Props:
 *   percentage  – 0-100 number
 *   size        – px dimension of the SVG (default 120)
 *   strokeWidth – ring stroke width (default 10)
 *   passed      – if true uses success colour, else danger
 *   label       – optional center label override (defaults to "X%")
 */
export const ScoreRing = ({
  percentage = 0,
  size = 120,
  strokeWidth = 10,
  passed = true,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * Math.max(0, Math.min(100, percentage)) / 100;
  const gap = circumference - filled;

  const trackColor = 'rgba(148,163,184,0.15)';
  const fillColor = passed
    ? 'url(#scoreGradientPass)'
    : 'url(#scoreGradientFail)';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="scoreGradientPass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="scoreGradientFail" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>

      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />

      {/* Filled arc — start at top (rotate -90°) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={fillColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />

      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.18}
        fontWeight={700}
        fill={passed ? '#10b981' : '#ef4444'}
      >
        {label ?? `${Math.round(percentage)}%`}
      </text>
    </svg>
  );
};

export default ScoreRing;
