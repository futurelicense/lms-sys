import { forwardRef, useId } from 'react';
import styles from './Input.module.css';

export const Input = forwardRef(
  ({ label, hint, error, required = false, className = '', id, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = [hint ? `${inputId}-hint` : null, error ? `${inputId}-error` : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={`${styles.field} ${className}`}>
        {label && (
          <label className={styles.label} htmlFor={inputId}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${styles.control} ${error ? styles.invalid : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          required={required}
          {...rest}
        />
        {hint && !error && (
          <span className={styles.hint} id={`${inputId}-hint`}>
            {hint}
          </span>
        )}
        {error && (
          <span className={styles.error} id={`${inputId}-error`} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
