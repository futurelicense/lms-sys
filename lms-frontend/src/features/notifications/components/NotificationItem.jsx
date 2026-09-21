import Notification from '../../../components/feedback/Notification';

/** Feature-level alias so notification screens do not reach into components/feedback. */
export const NotificationItem = (props) => <Notification {...props} />;

export default NotificationItem;
