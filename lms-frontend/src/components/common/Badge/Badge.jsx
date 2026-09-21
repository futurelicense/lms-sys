import styles from './Badge.module.css';

/** @param {'neutral'|'success'|'warning'|'danger'|'info'} tone */
export const Badge = ({ tone = 'neutral', className = '', children }) => (
  <span className={`${styles.badge} ${styles[tone]} ${className}`}>{children}</span>
);

export default Badge;
