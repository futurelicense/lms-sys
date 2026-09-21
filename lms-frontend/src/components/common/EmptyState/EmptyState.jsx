import styles from './EmptyState.module.css';

export const EmptyState = ({
  icon = null,
  title = 'Nothing here yet',
  description,
  action = null,
}) => (
  <div className={styles.wrapper}>
    {icon}
    <h4 className={styles.title}>{title}</h4>
    {description && <p className={styles.description}>{description}</p>}
    {action}
  </div>
);

export default EmptyState;
