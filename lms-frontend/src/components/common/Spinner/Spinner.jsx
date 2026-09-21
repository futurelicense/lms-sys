import styles from './Spinner.module.css';

export const Spinner = ({ label = 'Loading', fullPage = false, size = 'md' }) => (
  <div className={fullPage ? styles.fullPage : styles.wrapper} role="status" aria-live="polite">
    <span className={`${styles.spinner} ${size === 'lg' ? styles.lg : ''}`} />
    <span className={fullPage ? styles.label : 'u-sr-only'}>{label}</span>
  </div>
);

export default Spinner;
