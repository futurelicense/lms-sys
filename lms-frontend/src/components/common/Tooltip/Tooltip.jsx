import { useId, useState } from 'react';
import styles from './Tooltip.module.css';

/** Shows on hover and on keyboard focus - focus support is not optional. */
export const Tooltip = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className={styles.wrapper}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      {visible && (
        <span className={styles.bubble} id={tooltipId} role="tooltip">
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
