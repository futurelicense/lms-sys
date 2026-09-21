import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Laptop, Smartphone, Globe, ShieldAlert, LogOut, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Alert from '../../../components/feedback/Alert';
import profileService from '../services/profileService';
import { useToast } from '../../../components/feedback/Toast';

export const ActiveSessionsCard = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: profileService.getSessions,
  });

  const revokeMutation = useMutation({
    mutationFn: profileService.revokeSession,
    onSuccess: () => {
      toast.success('Session revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: profileService.revokeAllSessions,
    onSuccess: () => {
      toast.success('Signed out of all other devices');
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
    },
  });

  if (isLoading) return <Spinner />;
  if (error) return <Alert tone="error">Failed to load active sessions.</Alert>;

  const sessionList = Array.isArray(sessions) ? sessions : (sessions?.content ?? []);

  return (
    <Card
      title="Active Sessions & Security Devices"
      subtitle="Manage your active logins across desktop browsers, laptops, and mobile devices."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sessionList.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Globe size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>No active session history found.</p>
          </div>
        ) : (
          <AnimatePresence>
            {sessionList.map((session, index) => {
              const isMobile = /mobile|android|iphone/i.test(session.userAgent || '');
              const Icon = isMobile ? Smartphone : Laptop;

              return (
                <motion.div
                  key={session.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: 14,
                    background: session.current
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.04))'
                      : 'var(--surface-medium, #1e293b)',
                    border: session.current
                      ? '1px solid rgba(99, 102, 241, 0.3)'
                      : '1px solid var(--border-color, #334155)',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 240, flex: 1 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: session.current ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-dark, #0f172a)',
                        color: session.current ? 'var(--primary, #6366f1)' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                          {session.userAgent || 'Web Browser'}
                        </span>
                        {session.current && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 10px',
                              borderRadius: 12,
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#22c55e',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={12} /> Active Now
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span>IP: {session.ipAddress || '127.0.0.1'}</span>
                        {session.lastAccessedAt && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> Last active: {new Date(session.lastAccessedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!session.current && (
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={revokeMutation.isPending && revokeMutation.variables === session.id}
                      onClick={() => revokeMutation.mutate(session.id)}
                      style={{ borderRadius: 8 }}
                    >
                      Revoke Access
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
            If you suspect unauthorized access, click sign out to terminate all non-current sessions immediately.
          </p>
          <Button
            variant="danger"
            size="sm"
            isLoading={revokeAllMutation.isPending}
            onClick={() => revokeAllMutation.mutate()}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            <LogOut size={14} style={{ marginRight: 6 }} /> Terminate All Other Sessions
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ActiveSessionsCard;
