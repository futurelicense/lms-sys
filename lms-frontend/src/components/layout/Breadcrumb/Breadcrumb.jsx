import { Link } from 'react-router-dom';
import styles from './Breadcrumb.module.css';

/** items: [{ label, to? }] - the last item renders as the current page. */
export const Breadcrumb = ({ items = [] }) => {
  if (items.length === 0) return null;

  return (
    <nav className={styles.nav} aria-label="Breadcrumb">
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {isLast || !item.to ? (
                <span
                  className={isLast ? styles.current : undefined}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link to={item.to}>{item.label}</Link>
              )}
              {!isLast && <span className={styles.separator}> / </span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
