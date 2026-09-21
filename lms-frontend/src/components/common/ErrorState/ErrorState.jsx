import styles from '../EmptyState/EmptyState.module.css';
import Button from '../Button';

export const ErrorState = ({
  title = 'Something went wrong',
  error,
  onRetry,
  retryLabel = 'Try again',
}) => (
  <div className={styles.wrapper} role="alert">
    <h4 className={styles.title}>{title}</h4>
    <p className={styles.description}>{error?.message ?? 'Please try again in a moment.'}</p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry}>
        {retryLabel}
      </Button>
    )}
  </div>
);

export default ErrorState;
