import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, Award, Search, CheckCircle2, AlertTriangle, XCircle,
  Calendar, Building2, User, BookOpen, Download, Copy, Check, ExternalLink,
  ArrowRight, Sparkles, RefreshCw
} from 'lucide-react';
import certificateService from '../services/certificateService';

export const PublicCertificateVerifyPage = () => {
  const { serialNumber: urlSerial } = useParams();
  const navigate = useNavigate();

  const [serialInput, setSerialInput] = useState(urlSerial || '');
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (urlSerial) {
      setSerialInput(urlSerial);
      verifyCertificate(urlSerial);
    }
  }, [urlSerial]);

  const verifyCertificate = async (serial) => {
    const query = (serial || serialInput).trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setVerifiedData(null);

    try {
      const response = await certificateService.verify(query);
      const data = response?.data || response;
      setVerifiedData(data);
    } catch (err) {
      console.error('Verification error:', err);
      setError(
        err.response?.status === 404
          ? 'Certificate not found. Please double-check the serial number.'
          : err.response?.data?.message || 'Unable to verify credential at this time. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    navigate(`/verify/${encodeURIComponent(serialInput.trim())}`);
  };

  const copyVerificationLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#090D16',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px 80px 20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ width: '100%', maxWidth: '780px', position: 'relative', zIndex: 1 }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#A5B4FC',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            <ShieldCheck size={16} />
            Institutional Credential Registry
          </div>
          <h1
            style={{
              fontSize: '34px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 10px 0',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Certificate Verification Portal
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '15px', margin: 0, maxWidth: '520px', margin: '0 auto' }}>
            Verify the cryptographic validity and academic authenticity of credentials issued by our learning platform.
          </p>
        </div>

        {/* Verification Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px',
            borderRadius: '14px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
            marginBottom: '32px',
          }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Enter Certificate Serial (e.g. CERT-2026-A1B2C3D4)..."
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: '10px',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: '#FFF',
                fontSize: '15px',
                fontFamily: 'monospace',
                fontWeight: 600,
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !serialInput.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#FFF',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              cursor: loading || !serialInput.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !serialInput.trim() ? 0.6 : 1,
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            }}
          >
            {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />}
            Verify Credential
          </button>
        </form>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
            <div
              style={{
                display: 'inline-block',
                width: 32,
                height: 32,
                border: '3px solid rgba(255, 255, 255, 0.1)',
                borderTopColor: '#6366F1',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: 14,
              }}
            />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Querying cryptographic registry...</div>
          </div>
        )}

        {/* Error / Not Found Message */}
        {error && !loading && (
          <div
            style={{
              padding: '24px',
              borderRadius: '14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <XCircle size={20} color="#F87171" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FCA5A5', margin: '0 0 4px 0' }}>
                Verification Unsuccessful
              </h3>
              <p style={{ color: '#FECACA', fontSize: '14px', margin: 0, lineHeight: 1.4 }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Verified Credential Card */}
        {verifiedData && !loading && (
          <div
            style={{
              borderRadius: '20px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.7)',
              overflow: 'hidden',
              position: 'relative',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            {/* Top Verification Status Banner */}
            <div
              style={{
                padding: '16px 24px',
                backgroundColor:
                  verifiedData.status === 'ACTIVE'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                borderBottom: `1px solid ${
                  verifiedData.status === 'ACTIVE'
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'rgba(239, 68, 68, 0.25)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {verifiedData.status === 'ACTIVE' ? (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={18} color="#FFF" />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AlertTriangle size={18} color="#FFF" />
                  </div>
                )}
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: verifiedData.status === 'ACTIVE' ? '#34D399' : '#F87171',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {verifiedData.status === 'ACTIVE' ? 'Official Verified Credential' : 'Credential Revoked'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Authenticity verified against central registry
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#CBD5E1',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {verifiedData.serialNumber}
                </span>
                <button
                  onClick={copyVerificationLink}
                  title="Copy verification link"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#E2E8F0',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Share'}
                </button>
              </div>
            </div>

            {/* Certificate Presentation Body */}
            <div style={{ padding: '32px 36px' }}>
              <div
                style={{
                  padding: '30px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Watermark seal */}
                <Award
                  size={180}
                  style={{
                    position: 'absolute',
                    right: -20,
                    bottom: -20,
                    opacity: 0.04,
                    color: '#FFF',
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ fontSize: '12px', color: '#818CF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Certificate of Completion
                </div>

                <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: 4 }}>This verifies that</div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: '#F8FAFC',
                    marginBottom: 12,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {verifiedData.studentName}
                </div>

                <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: 4 }}>
                  has successfully completed all graduation criteria for the curriculum
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 24,
                  }}
                >
                  <BookOpen size={20} color="#818CF8" />
                  {verifiedData.courseTitle}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 16,
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                      Issuing Institution
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#CBD5E1', marginTop: 3 }}>
                      {verifiedData.organizationName || 'LMS Institutional Academy'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                      Issue Date
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#CBD5E1', marginTop: 3 }}>
                      {verifiedData.issuedAt ? verifiedData.issuedAt.slice(0, 10) : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                      Credential Validity
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#34D399', marginTop: 3 }}>
                      Permanent / Valid
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div
              style={{
                padding: '16px 36px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Cryptographic Serial: <span style={{ fontFamily: 'monospace', color: '#94A3B8' }}>{verifiedData.serialNumber}</span>
              </div>
              <Link
                to="/"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#818CF8',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Back to Academy <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCertificateVerifyPage;
