import { forwardRef, useId } from 'react';
import styles from './Checkbox.module.css';

export const Checkbox = forwardRef(({ label, error, className = '', id, ...rest }, ref) => {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className={className}>
      <div className={styles.wrapper}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={styles.input}
          aria-invalid={Boolean(error)}
          {...rest}
        />
        {label && (
          <label className={styles.label} htmlFor={checkboxId}>
            {label}
          </label>
        )}
      </div>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
