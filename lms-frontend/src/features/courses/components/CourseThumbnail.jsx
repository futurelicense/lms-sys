const style = {
  width: '100%',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
  background: 'var(--color-surface-alt)',
  borderRadius: 'var(--radius-md)',
};

export const CourseThumbnail = ({ src, alt = '', loading = 'lazy' }) =>
  src ? (
    <img src={src} alt={alt} style={style} loading={loading} />
  ) : (
    <div style={style} aria-hidden="true" />
  );

export default CourseThumbnail;
