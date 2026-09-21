import { useId } from 'react';
import styles from '../Checkbox/Checkbox.module.css';

/** Radio group - always renders as a fieldset so screen readers announce the legend. */
export const Radio = ({ name, legend, options = [], value, onChange, error, className = '' }) => {
  const groupId = useId();

  return (
    <fieldset className={`${styles.group} ${className}`}>
      {legend && <legend className={styles.legend}>{legend}</legend>}
      {options.map((option) => {
        const optionId = `${groupId}-${option.value}`;
        return (
          <div className={styles.wrapper} key={option.value}>
            <input
              type="radio"
              id={optionId}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              disabled={option.disabled}
              className={styles.input}
            />
            <label className={styles.label} htmlFor={optionId}>
              {option.label}
            </label>
          </div>
        );
      })}
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </fieldset>
  );
};

export default Radio;
