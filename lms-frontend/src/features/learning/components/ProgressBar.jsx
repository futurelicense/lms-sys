const track = {
  height: 8,
  width: '100%',
  background: 'var(--color-surface-alt)',
  borderRadius: 'var(--radius-full)',
  overflow: 'hidden',
};

export const ProgressBar = ({ value = 0, label = 'Progress' }) => {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div style={track}>
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            background: 'var(--color-primary-600)',
            transition: 'width var(--transition-base)',
          }}
        />
      </div>
      <span className="u-text-sm u-text-muted">{clamped}% complete</span>
    </div>
  );
};

export default ProgressBar;
