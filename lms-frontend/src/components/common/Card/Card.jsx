import styles from './Card.module.css';

export const Card = ({ title, subtitle, actions, footer, onClick, className = '', children, style }) => (
  <section
    className={`${styles.card} ${onClick ? styles.interactive : ''} ${className}`}
    onClick={onClick}
    style={style}
  >
    {(title || subtitle || actions) && (
      <header className={styles.header}>
        <div>
          {typeof title === 'string' ? <h4 className={styles.title}>{title}</h4> : title}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions}
      </header>
    )}
    <div className={styles.body}>{children}</div>
    {footer && <footer className={styles.footer}>{footer}</footer>}
  </section>
);

export default Card;
