import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ROUTES } from '../../../constants/routes';
import { formatDate } from '../../../utils/dateUtils';
import { downloadBlob } from '../../../utils/fileUtils';
import certificateService from '../services/certificateService';

export const CertificateCard = ({ certificate }) => {
  const handleDownload = async () => {
    const blob = await certificateService.download(certificate.id);
    downloadBlob(blob, `${certificate.courseTitle}-certificate.pdf`);
  };

  return (
    <Card
      title={<Link to={ROUTES.CERTIFICATE_DETAILS(certificate.id)}>{certificate.courseTitle}</Link>}
      actions={
        <Button variant="secondary" size="sm" onClick={handleDownload}>
          Download
        </Button>
      }
    >
      <p className="u-text-sm u-text-muted">
        Issued {formatDate(certificate.issuedAt)} &middot; ID {certificate.serialNumber}
      </p>
    </Card>
  );
};

export default CertificateCard;
