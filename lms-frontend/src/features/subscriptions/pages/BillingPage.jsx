import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Download, CreditCard, Plus,
  Calendar, ArrowLeft, Search, Building2, ChevronRight,
  Receipt, AlertCircle
} from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { useToast } from '../../../components/feedback/Toast';
import subscriptionService from '../services/subscriptionService';
import { ROUTES } from '../../../constants/routes';

export const BillingPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');

  const { data: rawData } = useQuery({
    queryKey: ['subscription', 'billing'],
    queryFn: () => subscriptionService.billingHistory().catch(() => null),
  });

  const apiInvoices = rawData?.data?.data?.content ?? rawData?.data?.content ?? rawData?.data;
  const invoices = Array.isArray(apiInvoices) ? apiInvoices : [];

  const filteredInvoices = invoices.filter((inv) =>
    (inv.id + ' ' + inv.description).toLowerCase().includes(search.toLowerCase())
  );

  const handleDownloadInvoice = (inv) => {
    toast.info(`Preparing invoice ${inv.id}…`);
    // Real PDF download will use a signed URL from the billing API
    window.open(inv.downloadUrl ?? '#', '_blank', 'noopener');
  };

  return (
    <PageContainer
      title="Billing &amp; Invoices"
      subtitle="View payment history, download invoice receipts, and manage billing contacts."
      actions={
        <Button
          variant="secondary"
          onClick={() => navigate(ROUTES.SUBSCRIPTION)}
          iconLeft={<ArrowLeft size={15} />}
        >
          Subscription
        </Button>
      }
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to={ROUTES.SUBSCRIPTION} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Subscription
          </Link>
          <ChevronRight size={13} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Billing &amp; Invoices</span>
        </div>

        {/* ── Not-configured banner ── */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 28,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
        }}>
          <AlertCircle size={22} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Billing not configured
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Payment method and billing contact details have not been set up yet.
              Contact your platform administrator to configure billing for this organisation.
            </p>
          </div>
        </div>

        {/* ── Invoice History Table ── */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 20,
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={18} style={{ color: '#6366f1' }} />
                Invoice Receipts ({filteredInvoices.length})
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                Download formal PDF invoices for accounting and tax records.
              </p>
            </div>

            {/* Search */}
            {invoices.length > 0 && (
              <div style={{ position: 'relative', width: 260 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search invoices…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface-medium)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </div>

          {/* Empty state */}
          {!isLoading && invoices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <FileText size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No billing history</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                Invoices will appear here once billing is active.
              </p>
            </div>
          )}

          {/* Table — only rendered when real invoices exist */}
          {filteredInvoices.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-medium)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)' }}>Invoice ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)' }}>Billing Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)' }}>Description</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)' }}>Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {inv.id}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {new Date(inv.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {inv.description}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {inv.amount}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: inv.status === 'PAID' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245,158,11,0.12)',
                          color: inv.status === 'PAID' ? '#10b981' : '#f59e0b',
                        }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(inv)}
                          style={{
                            background: 'var(--surface-medium)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 6,
                            padding: '5px 10px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Download size={13} /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default BillingPage;
