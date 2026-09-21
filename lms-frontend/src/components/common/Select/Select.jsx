import { forwardRef, useId } from 'react';
// Form controls deliberately share one stylesheet so they stay visually identical.
import styles from '../Input/Input.module.css';

export const Select = forwardRef(
  (
    {
      label,
      options = [],
      placeholder = 'Select...',
      error,
      required = false,
      className = '',
      id,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className={`${styles.field} ${className}`}>
        {label && (
          <label className={styles.label} htmlFor={selectId}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`${styles.control} ${error ? styles.invalid : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${selectId}-error` : undefined}
          required={required}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <span className={styles.error} id={`${selectId}-error`} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;
