import { forwardRef, useId } from 'react';
import styles from '../Input/Input.module.css';

export const TextArea = forwardRef(
  (
    {
      label,
      hint,
      error,
      rows = 4,
      maxLength,
      value,
      required = false,
      className = '',
      id,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const textAreaId = id ?? generatedId;

    return (
      <div className={`${styles.field} ${className}`}>
        {label && (
          <label className={styles.label} htmlFor={textAreaId}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textAreaId}
          rows={rows}
          maxLength={maxLength}
          {...(value !== undefined ? { value } : {})}
          className={`${styles.control} ${error ? styles.invalid : ''}`}
          aria-invalid={Boolean(error)}
          required={required}
          {...rest}
        />
        <span className={styles.hint}>
          {error ? (
            <span className={styles.error} role="alert">
              {error}
            </span>
          ) : (
            hint
          )}
          {maxLength ? ` ${(value ?? '').length}/${maxLength}` : ''}
        </span>
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';

export default TextArea;
