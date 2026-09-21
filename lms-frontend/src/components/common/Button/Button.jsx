import styles from './Button.module.css';

/**
 * @param {'primary'|'secondary'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'lg'} size
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  isLoading = false,
  fullWidth = false,
  disabled = false,
  leftIcon = null,
  className = '',
  children,
  ...rest
}) => {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : leftIcon}
      {children}
    </button>
  );
};

export default Button;
