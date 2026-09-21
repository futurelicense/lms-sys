import styles from './Skeleton.module.css';

export const Skeleton = ({ width = '100%', height = 16, radius, count = 1, className = '' }) => {
  const style = { width, height, borderRadius: radius };
  if (count === 1) {
    return <span className={`${styles.skeleton} ${className}`} style={style} aria-hidden="true" />;
  }
  return (
    <span className={styles.stack} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={`${styles.skeleton} ${className}`} style={style} />
      ))}
    </span>
  );
};

export default Skeleton;
