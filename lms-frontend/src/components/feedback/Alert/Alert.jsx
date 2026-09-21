import styles from './Alert.module.css';

export const Alert = ({ tone = 'info', title, onDismiss, children }) => (
  <div className={`${styles.alert} ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
    <div>
      {title && <div className={styles.title}>{title}</div>}
      <div>{children}</div>
    </div>
    {onDismiss && (
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
        &times;
      </button>
    )}
  </div>
);

export default Alert;
