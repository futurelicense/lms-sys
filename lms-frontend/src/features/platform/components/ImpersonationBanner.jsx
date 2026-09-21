import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Clock, ShieldAlert, Wrench } from 'lucide-react';
import tokenStorage from '../../../services/storage/tokenStorage';
import { ROUTES } from '../../../constants/routes';

export const ImpersonationBanner = () => {
  const [impersonation, setImpersonation] = useState(() => {
    try {
      const stored = localStorage.getItem('lms_impersonation');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const expiresAt = useMemo(() => {
    if (!impersonation?.expiresAt) return null;
    return typeof impersonation.expiresAt === 'number'
      ? impersonation.expiresAt
      : new Date(impersonation.expiresAt).getTime();
  }, [impersonation]);

  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (!expiresAt) return 1800; // default 30 mins
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('lms_impersonation');
        setImpersonation(stored ? JSON.parse(stored) : null);
      } catch {
        setImpersonation(null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!impersonation?.isImpersonating || !expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        localStorage.removeItem('lms_impersonation');
        tokenStorage.clear();
        alert('Your 30-minute temporary debug session has expired. You are being returned to the Platform Control Plane.');
        window.location.href = impersonation.returnUrl || ROUTES.PLATFORM_TENANTS;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, impersonation]);

  if (!impersonation?.isImpersonating) return null;

  const handleRevoke = () => {
    localStorage.removeItem('lms_impersonation');
    tokenStorage.clear();
    window.location.href = impersonation.returnUrl || ROUTES.PLATFORM_TENANTS;
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = secondsRemaining < 300; // under 5 minutes

  return (
    <div
      style={{
        background: isUrgent ? '#dc2626' : '#d97706',
        color: '#ffffff',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        borderBottom: '1px solid rgba(0, 0, 0, 0.2)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        transition: 'background 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, letterSpacing: '-0.2px' }}>
          <Wrench size={16} style={{ color: '#ffffff' }} />
          <span>TEMPORARY DEBUG ACCESS (30M)</span>
        </div>

        <span style={{ opacity: 0.7 }}>•</span>

        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Workspace:{' '}
          <strong
            style={{
              fontFamily: 'monospace',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            {impersonation.tenantSlug}
          </strong>{' '}
          as <strong>{impersonation.targetUserEmail}</strong>
        </span>

        {impersonation.reason && (
          <>
            <span style={{ opacity: 0.7 }}>•</span>
            <span
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 12,
                maxWidth: 260,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={impersonation.reason}
            >
              Purpose: <em>{impersonation.reason}</em>
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* Countdown Timer Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(0, 0, 0, 0.3)',
            color: isUrgent ? '#fecaca' : '#fef3c7',
            padding: '4px 10px',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 12,
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            border: isUrgent ? '1px solid rgba(254, 202, 202, 0.5)' : '1px solid rgba(254, 243, 199, 0.3)',
          }}
        >
          <Clock size={13} className={isUrgent ? 'animate-pulse' : ''} />
          <span>{formattedTime}</span>
        </div>

        {/* Revoke Action */}
        <button
          onClick={handleRevoke}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#000000',
            color: '#ffffff',
            border: 'none',
            padding: '5px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#27272a')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#000000')}
        >
          <ArrowLeft size={13} />
          Revoke Session
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
