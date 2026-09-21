import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Drawer.module.css';

export const Drawer = ({ isOpen, onClose, title, side = 'right', children }) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <aside className={`${styles.panel} ${styles[side]}`} role="dialog" aria-label={title}>
        <header className={styles.header}>
          <h3>{title}</h3>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close panel">
            &times;
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </aside>
    </>,
    document.body,
  );
};

export default Drawer;
