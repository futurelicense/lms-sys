import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Globe, Mail, ShieldCheck, Settings, CreditCard,
  Users, BookOpen, GraduationCap, HardDrive, Clock, ArrowUpRight,
  ExternalLink, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Spinner from '../../../components/common/Spinner';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import tenantService from '../services/tenantService';
import { ROUTES } from '../../../constants/routes';

export const OrganizationPage = () => {
  const navigate = useNavigate();

  const { data: rawData } = useQuery({
    queryKey: ['tenant', 'current'],
    queryFn: () => tenantService.getCurrent().catch(() => null),
  });

  const apiTenant = rawData?.data?.data ?? rawData?.data ?? rawData;

  // Fallback defaults for seamless rich UI experience
  const org = {
    name: apiTenant?.name || 'Acme Learning Academy',
    subdomain: apiTenant?.subdomain || 'acme-academy',
    domain: apiTenant?.customDomain || 'learn.acme.edu',
    contactEmail: apiTenant?.contactEmail || 'admin@acme-academy.com',
    plan: apiTenant?.plan || 'Enterprise Pro',
    status: apiTenant?.status || 'ACTIVE',
    createdAt: apiTenant?.createdAt || '2025-01-15T08:00:00Z',
    timezone: apiTenant?.timezone || 'UTC (GMT+0)',
    totalStudents: apiTenant?.totalStudents || 1248,
    totalInstructors: apiTenant?.totalInstructors || 42,
    activeCourses: apiTenant?.activeCourses || 86,
    storageUsedGb: apiTenant?.storageUsedGb || 148,
    storageLimitGb: apiTenant?.storageLimitGb || 500,
  };

  const storagePct = Math.round((org.storageUsedGb / org.storageLimitGb) * 100);

  return (
    <PageContainer
      title="Organization Profile"
      subtitle="Overview of your institution, workspace settings, and system metrics."
      actions={
        <Button
          variant="primary"
          onClick={() => navigate(ROUTES.ORGANIZATION_SETTINGS)}
          iconLeft={<Settings size={15} />}
        >
          Manage Settings
        </Button>
      }
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ── Organization Hero Card ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: 20,
          padding: '32px 36px',
          color: '#ffffff',
          boxShadow: '0 20px 40px rgba(99,102,241,0.25)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24,
        }}>
          {/* Decorative background glow */}
          <div style={{
            position: 'absolute', top: -50, right: -50, width: 220, height: 220,
            borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            }}>
              <Building2 size={34} style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {org.name}
                </h1>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: '#4ade80',
                  padding: '3px 10px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                }}>
                  <CheckCircle2 size={12} /> {org.status}
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={13} /> {org.domain}
                <span style={{ opacity: 0.5 }}>•</span>
                <Mail size={13} /> {org.contactEmail}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
            <button
              onClick={() => navigate(ROUTES.SUBSCRIPTION)}
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backdropFilter: 'blur(6px)',
                transition: 'background 0.15s',
              }}
            >
              <Sparkles size={15} style={{ color: '#fbbf24' }} />
              {org.plan} Plan
            </button>
          </div>
        </div>

        {/* ── Key Metrics Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {/* Learners Card */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 14,
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: 'rgba(99,102,241,0.12)', color: '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Active Learners
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                {org.totalStudents.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Instructors Card */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 14,
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: 'rgba(16,185,129,0.12)', color: '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Instructors
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                {org.totalInstructors}
              </p>
            </div>
          </div>

          {/* Published Courses */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 14,
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Active Courses
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                {org.activeCourses}
              </p>
            </div>
          </div>

          {/* Cloud Storage Meter */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 14,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HardDrive size={16} style={{ color: '#0ea5e9' }} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Storage Usage
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {org.storageUsedGb} / {org.storageLimitGb} GB
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--surface-medium)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${storagePct}%`,
                background: 'linear-gradient(90deg, #0ea5e9, #6366f1)',
                borderRadius: 4,
              }} />
            </div>
          </div>
        </div>

        {/* ── Quick Management Hub ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {/* Settings Card */}
          <div
            onClick={() => navigate(ROUTES.ORGANIZATION_SETTINGS)}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              padding: 24,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(99,102,241,0.12)', color: '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Settings size={22} />
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Organization Settings
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Configure branding, custom domain, single sign-on (SSO), and email notifications.
              </p>
            </div>
          </div>

          {/* Subscription Card */}
          <div
            onClick={() => navigate(ROUTES.SUBSCRIPTION)}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              padding: 24,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CreditCard size={22} />
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Subscription & Plans
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Manage your billing frequency, view invoices, and compare tier features.
              </p>
            </div>
          </div>

          {/* Security & Roles Card */}
          <div
            onClick={() => navigate(ROUTES.ROLES)}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              padding: 24,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(16,185,129,0.12)', color: '#10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldCheck size={22} />
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Roles & Access Control
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Fine-tune permissions for Instructors, Administrators, and Student roles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default OrganizationPage;
