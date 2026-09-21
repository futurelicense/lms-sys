import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, Download, ArrowLeft, Calendar, User, BookOpen } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Spinner from '../../../components/common/Spinner';
import ErrorState from '../../../components/common/ErrorState';
import Button from '../../../components/common/Button';
import certificateService from '../services/certificateService';
import { ROUTES } from '../../../constants/routes';

const handleDownload = async (id, courseName) => {
  try {
    const res = await certificateService.download(id);
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${courseName?.replace(/\s+/g, '-') ?? id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    // silently ignore
  }
};

/**
 * Fully wired certificate detail page.
 * Shows the certificate visual preview and download action.
 */
export const CertificateDetailsPage = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();

  const { data: raw, isLoading, error, refetch } = useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: () => certificateService.getById(certificateId),
    enabled: Boolean(certificateId),
  });

  if (isLoading) return <Spinner fullPage />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const cert = raw?.data?.data ?? raw?.data ?? raw;

  return (
    <PageContainer
      title="Certificate"
      actions={
        <Button variant="secondary" onClick={() => navigate(ROUTES.CERTIFICATES)} iconLeft={<ArrowLeft size={14} />}>
          All Certificates
        </Button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 24, width: '100%', alignItems: 'start' }}>
        {/* Left: Certificate Visual (Full Width) */}
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
            borderRadius: 20,
            padding: '56px 48px',
            color: '#ffffff',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(99,102,241,0.35)',
            position: 'relative',
            overflow: 'hidden',
            border: '2px solid rgba(251, 191, 36, 0.3)',
          }}>
            {/* Decorative circles & watermark */}
            <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'absolute', bottom: -40, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Award Icon Seal */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(251,191,36,0.2)',
                border: '3px solid rgba(251,191,36,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 0 30px rgba(251,191,36,0.3)',
              }}>
                <Award size={42} style={{ color: '#fbbf24' }} />
              </div>

              <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#fbbf24', fontWeight: 700, marginBottom: 8 }}>
                Official Certificate of Mastery
              </p>

              <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                {cert?.courseName ?? cert?.title ?? 'Course Certificate'}
              </h1>

              {cert?.studentName && (
                <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 8 }}>
                  This acknowledges that <strong>{cert.studentName}</strong> has successfully completed all required modules, assessments, and practical challenges.
                </p>
              )}

              {cert?.issuedAt && (
                <p style={{ fontSize: 14, opacity: 0.7, marginTop: 12 }}>
                  Issued on {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}

              {/* Certificate Verification ID */}
              <div style={{
                marginTop: 32,
                padding: '10px 20px',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                display: 'inline-block',
                fontSize: 12,
                letterSpacing: '0.08em',
                fontFamily: 'monospace',
                color: '#e2e8f0',
              }}>
                VERIFICATION ID: {certificateId}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Credential Details & Verification Hub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Details Card */}
          <div style={{
            background: 'linear-gradient(180deg, #181b24 0%, #12141c 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 18,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              Credential Verification
            </h3>

            {cert?.studentName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Recipient</p>
                  <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{cert.studentName}</p>
                </div>
              </div>
            )}

            {cert?.courseName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={18} style={{ color: '#34d399' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Curriculum</p>
                  <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{cert.courseName}</p>
                </div>
              </div>
            )}

            {cert?.issuedAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} style={{ color: '#fbbf24' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Issue Date</p>
                  <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button
                variant="primary"
                onClick={() => handleDownload(certificateId, cert?.courseName)}
                iconLeft={<Download size={16} />}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Download Official PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default CertificateDetailsPage;
