import React, { useState, useRef } from 'react';
import {
  Upload,
  Award,
  FileText,
  Link as LinkIcon,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  FileUp,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Modal from '../../../components/common/Modal/Modal';
import Button from '../../../components/common/Button';

const PRESET_PROVIDERS = [
  { name: 'Amazon Web Services', tag: 'AWS', color: '#ff9900', bg: 'rgba(255, 153, 0, 0.12)' },
  { name: 'Coursera', tag: 'Coursera', color: '#0056d2', bg: 'rgba(0, 86, 210, 0.12)' },
  { name: 'Google Cloud', tag: 'GCP', color: '#4285f4', bg: 'rgba(66, 133, 244, 0.12)' },
  { name: 'Microsoft Azure', tag: 'Azure', color: '#0078d4', bg: 'rgba(0, 120, 212, 0.12)' },
  { name: 'Udemy', tag: 'Udemy', color: '#a435f0', bg: 'rgba(164, 53, 240, 0.12)' },
  { name: 'Meta Developer', tag: 'Meta', color: '#0668e1', bg: 'rgba(6, 104, 225, 0.12)' },
  { name: 'HackerRank', tag: 'HackerRank', color: '#00ea64', bg: 'rgba(0, 234, 100, 0.12)' },
];

export const ImportCertificateModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'file'
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [noExpiry, setNoExpiry] = useState(true);
  const [credentialId, setCredentialId] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [skills, setSkills] = useState('');
  const [grade, setGrade] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const jsonFileInputRef = useRef(null);

  const resetForm = () => {
    setTitle('');
    setIssuer('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setExpiryDate('');
    setNoExpiry(true);
    setCredentialId('');
    setVerificationUrl('');
    setSkills('');
    setGrade('');
    setFileName('');
    setFileDataUrl(null);
    setJsonInput('');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectPreset = (preset) => {
    setIssuer(preset.name);
    if (!title) {
      setTitle(`${preset.tag} Certified Specialist`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleJsonFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        setJsonInput(text);
        parseAndFillJson(text);
      } catch {
        setErrorMsg('Failed to read JSON credential file.');
      }
    };
    reader.readAsText(file);
  };

  const parseAndFillJson = (text) => {
    try {
      const parsed = JSON.parse(text);
      const cred = parsed.credentialSubject || parsed;
      setTitle(cred.title || cred.name || cred.courseName || parsed.title || '');
      setIssuer(
        typeof parsed.issuer === 'string'
          ? parsed.issuer
          : parsed.issuer?.name || cred.issuer || 'External Credential'
      );
      if (parsed.issuanceDate || parsed.issuedAt || cred.issuedAt) {
        const d = (parsed.issuanceDate || parsed.issuedAt || cred.issuedAt).split('T')[0];
        setIssueDate(d);
      }
      setCredentialId(parsed.id || cred.id || cred.serialNumber || cred.credentialId || '');
      setVerificationUrl(parsed.verificationUrl || cred.verificationUrl || cred.url || '');
      setErrorMsg('');
    } catch {
      setErrorMsg('Invalid JSON format. Please check the credential payload.');
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Certificate or Credential title is required.');
      return;
    }
    if (!issuer.trim()) {
      setErrorMsg('Issuing institution or platform is required.');
      return;
    }

    const newCert = {
      id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      courseName: title.trim(),
      issuer: issuer.trim(),
      isImported: true,
      issuedAt: issueDate ? new Date(issueDate).toISOString() : new Date().toISOString(),
      expiresAt: !noExpiry && expiryDate ? new Date(expiryDate).toISOString() : null,
      credentialId: credentialId.trim() || `VER-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      verificationUrl: verificationUrl.trim() || null,
      skills: skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      grade: grade.trim() || null,
      fileName: fileName || null,
      fileDataUrl: fileDataUrl || null,
      importedAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('lms_imported_certificates') || '[]');
      const updated = [newCert, ...existing];
      localStorage.setItem('lms_imported_certificates', JSON.stringify(updated));
      onImportSuccess?.(newCert);
      handleClose();
    } catch (err) {
      console.error('Failed to save imported certificate:', err);
      setErrorMsg('Failed to save certificate to local storage.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Certificate & Credential" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: 'var(--text-primary)' }}>
        {/* Header subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Add external certifications from AWS, Coursera, Google, Udemy, or upload a verifiable credential.
          </p>

          {/* Tab Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: 3,
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTab === 'manual' ? 'var(--color-primary, #6366f1)' : 'transparent',
                color: activeTab === 'manual' ? '#fff' : 'var(--text-muted)',
              }}
            >
              Manual / Form
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTab === 'file' ? 'var(--color-primary, #6366f1)' : 'transparent',
                color: activeTab === 'file' ? '#fff' : 'var(--text-muted)',
              }}
            >
              JSON / Open Badges
            </button>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {activeTab === 'manual' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Quick Provider Presets */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                Quick Platform Presets
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESET_PROVIDERS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: issuer === preset.name ? `1.5px solid ${preset.color}` : '1px solid var(--border-color)',
                      background: issuer === preset.name ? preset.bg : 'var(--surface-medium)',
                      color: issuer === preset.name ? preset.color : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: preset.color }} />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Issuer Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Certificate / Course Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AWS Solutions Architect Associate"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Issuing Organization <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="e.g. Amazon Web Services, Coursera"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Dates Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: 8,
                    background: 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Expiration Date
                  </label>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={noExpiry}
                      onChange={(e) => setNoExpiry(e.target.checked)}
                    />
                    Does not expire
                  </label>
                </div>
                <input
                  type="date"
                  value={expiryDate}
                  disabled={noExpiry}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: 8,
                    background: noExpiry ? 'rgba(255,255,255,0.03)' : 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    color: noExpiry ? 'var(--text-muted)' : 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: noExpiry ? 'not-allowed' : 'text',
                  }}
                />
              </div>
            </div>

            {/* Credential ID & Verification URL */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Credential / License ID
                </label>
                <input
                  type="text"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  placeholder="e.g. AWS-SAA-109285"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Verification URL
                </label>
                <input
                  type="url"
                  value={verificationUrl}
                  onChange={(e) => setVerificationUrl(e.target.value)}
                  placeholder="https://coursera.org/verify/..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Skills & Optional Grade */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Key Skills Learned (comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. React, TypeScript, Cloud Architecture"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Grade / Score (Optional)
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. 95% or With Honors"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--surface-medium)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Upload PDF / Certificate Attachment */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Certificate Document / Badge Image (Optional)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed var(--border-color)',
                  borderRadius: 10,
                  padding: '16px 20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
              >
                <FileUp size={20} color="#818cf8" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {fileName ? fileName : 'Click to select PDF or Image certificate'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Supports PDF, PNG, JPG (up to 5MB)
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button variant="secondary" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                iconLeft={<ShieldCheck size={16} />}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                  fontWeight: 700,
                  padding: '10px 22px',
                }}
              >
                Save to Portfolio
              </Button>
            </div>
          </form>
        ) : (
          /* Tab 2: JSON / Open Badges */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              onClick={() => jsonFileInputRef.current?.click()}
              style={{
                border: '1.5px dashed var(--border-color)',
                borderRadius: 12,
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
            >
              <Upload size={28} color="#34d399" />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Upload Open Badges or LMS Credential JSON
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                Click to browse your computer for a exported .json certificate payload
              </p>
              <input
                type="file"
                ref={jsonFileInputRef}
                accept=".json,application/json"
                onChange={handleJsonFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Or paste credential JSON snippet:
              </label>
              <textarea
                rows={7}
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  if (e.target.value.trim().startsWith('{')) {
                    parseAndFillJson(e.target.value);
                  }
                }}
                placeholder='{\n  "title": "Full-Stack Engineer",\n  "issuer": "Coursera",\n  "id": "CERT-98214"\n}'
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--surface-medium)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {title && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#34d399',
                  fontSize: 13,
                }}
              >
                <CheckCircle2 size={16} />
                <span>Detected: <strong>{title}</strong> issued by <strong>{issuer}</strong></span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!title}
                iconLeft={<Sparkles size={16} />}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  fontWeight: 700,
                  padding: '10px 22px',
                }}
              >
                Import Credential
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportCertificateModal;
