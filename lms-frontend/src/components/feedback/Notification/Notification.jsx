import { formatRelative } from '../../../utils/dateUtils';
import styles from './Notification.module.css';

export const Notification = ({ notification, onSelect }) => {
  const isUnread = !notification.readAt && !notification.isRead && !notification.read;
  return (
    <article
      className={`${styles.item} ${isUnread ? styles.unread : ''}`}
      onClick={() => onSelect?.(notification)}
    >
      <div>
        <p className={styles.title}>{notification.title}</p>
        <p className={styles.meta}>
          {notification.message || notification.body || ''}
          {notification.createdAt ? ` · ${formatRelative(notification.createdAt)}` : ''}
        </p>
      </div>
    </article>
  );
};

export default Notification;
