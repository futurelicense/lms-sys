const frame = {
  border: '8px double var(--color-primary-500)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-7)',
  textAlign: 'center',
  background: 'var(--color-surface)',
};

export const CertificatePreview = ({ certificate }) => (
  <div style={frame}>
    <p className="u-text-muted">Certificate of completion</p>
    <h2 className="u-mt-2">{certificate?.learnerName}</h2>
    <p className="u-mt-2">has successfully completed</p>
    <h3 className="u-mt-2">{certificate?.courseTitle}</h3>
    <p className="u-text-sm u-text-muted u-mt-4">Serial {certificate?.serialNumber}</p>
  </div>
);

export default CertificatePreview;
