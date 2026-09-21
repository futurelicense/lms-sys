import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard, Sparkles, CheckCircle2, ArrowRight,
  TrendingUp, Users, HardDrive, Cpu, ShieldCheck,
  Calendar, FileText, Zap, ChevronRight
} from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import subscriptionService from '../services/subscriptionService';
import { ROUTES } from '../../../constants/routes';

export const SubscriptionPage = () => {
  const navigate = useNavigate();

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['subscription', 'current'],
    queryFn: () => subscriptionService.getCurrent().catch(() => null),
  });

  const sub = rawData?.data?.data ?? rawData?.data ?? null;

  const seatsPct  = sub ? Math.min(100, Math.round((sub.seatsUsed / sub.seatsLimit) * 100)) : 0;
  const storagePct = sub ? Math.min(100, Math.round((sub.storageUsedGb / sub.storageLimitGb) * 100)) : 0;
  const runsPct   = sub ? Math.min(100, Math.round((sub.sandboxRunsUsed / sub.sandboxRunsLimit) * 100)) : 0;

  if (!isLoading && !sub) {
    return (
      <PageContainer
        title="Subscription &amp; Plan"
        subtitle="Overview of your current enterprise tier, resource quota usage, and billing details."
      >
        <div style={{
          maxWidth: 600, margin: '60px auto', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          <CreditCard size={48} style={{ color: 'var(--text-muted)', opacity: 0.35 }} />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            Subscription not configured
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            No active subscription plan is linked to this organisation.
            Contact your platform administrator to set up billing.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Subscription &amp; Plan"
      subtitle="Overview of your current enterprise tier, resource quota usage, and billing details."
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.BILLING)}
            iconLeft={<FileText size={15} />}
          >
            Invoices &amp; Billing
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.PLANS)}
            iconRight={<ArrowRight size={15} />}
          >
            Change Plan
          </Button>
        </div>
      }
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ── Active Plan Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          borderRadius: 20,
          padding: '32px 36px',
          color: '#ffffff',
          boxShadow: '0 20px 40px rgba(99,102,241,0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', background: 'rgba(251, 191, 36, 0.2)',
                border: '1px solid rgba(251, 191, 36, 0.4)', color: '#fbbf24',
                padding: '3px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <Sparkles size={12} /> Active Tier
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {sub?.tierName ?? 'Unknown Plan'}
            </h1>
            {sub?.renewalDate && (
              <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.85 }}>
                Renews automatically on {new Date(sub.renewalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 36, fontWeight: 900 }}>{sub?.price ?? '—'}</span>
            {sub?.interval && <span style={{ fontSize: 14, opacity: 0.75 }}>/ {sub.interval}</span>}
          </div>
        </div>

        {/* ── Resource Quota Meters ── */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} style={{ color: '#6366f1' }} />
            Resource Usage & Quotas
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Seats Usage */}
            <div style={{
              background: 'var(--surface-medium)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} style={{ color: '#6366f1' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Learner Seats</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{seatsPct}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${seatsPct}%`, background: '#6366f1', borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {(sub?.seatsUsed ?? 0).toLocaleString()} of {(sub?.seatsLimit ?? 0).toLocaleString()} seats allocated
              </span>
            </div>

            {/* Storage Usage */}
            <div style={{
              background: 'var(--surface-medium)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HardDrive size={16} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Video & Media Storage</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{storagePct}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${storagePct}%`, background: '#10b981', borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {sub?.storageUsedGb ?? 0} GB of {sub?.storageLimitGb ?? 0} GB cloud storage used
              </span>
            </div>

            {/* Coding Runs */}
            <div style={{
              background: 'var(--surface-medium)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Cpu size={16} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Coding Assessment Runs</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{runsPct}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${runsPct}%`, background: '#f59e0b', borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {(sub?.sandboxRunsUsed ?? 0).toLocaleString()} of {(sub?.sandboxRunsLimit ?? 0).toLocaleString()} monthly submissions
              </span>
            </div>
          </div>
        </div>

        {/* ── Payment Method & Quick Links ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {/* Payment Method Card */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={17} style={{ color: '#6366f1' }} />
                Payment Method
              </h3>
              {sub?.paymentMethod ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--surface-medium)',
                  border: '1px solid var(--border-color)',
                }}>
                  <div style={{
                    width: 38, height: 26, borderRadius: 4,
                    background: '#1e293b', color: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800,
                  }}>
                    {sub.paymentMethod.brand?.slice(0, 4)?.toUpperCase() ?? 'CARD'}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      •••• •••• •••• {sub.paymentMethod.last4}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                      Expires {sub.paymentMethod.expMonth}/{sub.paymentMethod.expYear}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>No payment method on file.</p>
              )}
            </div>

            <Button
              variant="secondary"
              onClick={() => navigate(ROUTES.BILLING)}
              size="sm"
            >
              Update Payment Method
            </Button>
          </div>

          {/* Quick Plan Switch Card */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={17} style={{ color: '#fbbf24' }} />
                Need more seats or storage?
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Explore tier upgrades or add custom enterprise capacity with dedicated support and SLA.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => navigate(ROUTES.PLANS)}
              iconRight={<ChevronRight size={14} />}
              size="sm"
            >
              Compare All Plans
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default SubscriptionPage;
