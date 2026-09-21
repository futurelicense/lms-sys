import Breadcrumb from '../Breadcrumb';
import styles from './PageContainer.module.css';

export const PageContainer = ({ title, subtitle, breadcrumbs = [], actions = null, children }) => (
  <div className={styles.container}>
    {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
    {(title || actions) && (
      <div className={styles.head}>
        <div>
          {title && <h1>{title}</h1>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

export default PageContainer;
