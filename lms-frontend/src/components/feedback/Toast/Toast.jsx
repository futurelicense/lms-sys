import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import appConfig from '../../../config/appConfig';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

let nextId = 0;

const ICON_MAP = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ message, tone = 'info', duration = appConfig.toastDurationMs || 4000 }) => {
      nextId += 1;
      const id = nextId;
      setToasts((current) => [...current, { id, message, tone }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      notify,
      dismiss,
      success: (message) => notify({ message, tone: 'success' }),
      error: (message) => notify({ message, tone: 'error' }),
      warning: (message) => notify({ message, tone: 'warning' }),
      info: (message) => notify({ message, tone: 'info' }),
    }),
    [notify, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className={styles.viewport} role="region" aria-label="Notifications">
          {toasts.map((toast) => {
            const IconComponent = ICON_MAP[toast.tone] || Info;
            return (
              <div
                key={toast.id}
                className={`${styles.toast} ${styles[toast.tone] ?? ''}`}
                role="status"
              >
                <span className={styles.iconWrapper} aria-hidden="true">
                  <IconComponent size={18} className={styles.icon} />
                </span>
                <span className={styles.message}>{toast.message}</span>
                <button
                  type="button"
                  className={styles.close}
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
};

export default ToastProvider;

