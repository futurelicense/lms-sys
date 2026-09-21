import { useRef, useState } from 'react';
import { Camera, Check, Eye, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../../../components/common/Avatar';
import Button from '../../../components/common/Button';
import { validateFile } from '../../../utils/fileUtils';
import appConfig from '../../../config/appConfig';

export const ProfileAvatar = ({ user, onUpload, isUploading }) => {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    const message = validateFile(file, { accept: appConfig.acceptedImageTypes });
    setError(message);
    if (!message && file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewSrc(reader.result);
      reader.readAsDataURL(file);
      onUpload?.(file);
    }
    event.target.value = '';
  };

  const displayName = user?.fullName || user?.name || user?.email || 'User';
  const avatarSrc = previewSrc || user?.avatarUrl || user?.profileImageUrl;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      {/* Avatar Container with Hover Overlay & Pulsing Border */}
      <div style={{ position: 'relative' }}>
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => inputRef.current?.click()}
          style={{
            cursor: 'pointer',
            position: 'relative',
            borderRadius: '50%',
            padding: 3,
            background: 'linear-gradient(135deg, #2563eb, #3b82f6, #60a5fa)',
            boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.5)',
          }}
          title="Click to change profile photo"
        >
          <div
            style={{
              position: 'relative',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--surface-dark, #0f172a)',
            }}
          >
            <Avatar name={displayName} src={avatarSrc} size="lg" />

            {/* Hover Camera Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                color: '#ffffff',
                transition: 'opacity 0.2s ease',
              }}
            >
              <Camera size={22} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.5px' }}>CHANGE</span>
            </motion.div>
          </div>
        </motion.div>

        {/* View Full Photo Button */}
        {avatarSrc && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(true);
            }}
            title="View image"
            style={{
              position: 'absolute',
              bottom: 0,
              right: -4,
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--surface-medium, #1e293b)',
              border: '2px solid var(--bg, #0f172a)',
              color: 'var(--text-primary, #f8fafc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <Eye size={12} />
          </button>
        )}
      </div>

      {/* Upload Details & Actions */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Button
            size="sm"
            isLoading={isUploading}
            onClick={() => inputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 8,
              fontWeight: 600,
              background: '#ffffff',
              color: '#1e3a8a',
              border: '1px solid #ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <UploadCloud size={16} />
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', marginTop: 6, margin: '6px 0 0', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
          PNG, JPG, or GIF up to 5MB. Square ratio works best.
        </p>

        {error && (
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: 500 }}>
            {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={appConfig.acceptedImageTypes.join(',')}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {/* Fullscreen Photo Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPreviewOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: 400,
                width: '100%',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                background: 'var(--surface-dark, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                padding: 16,
                textAlign: 'center',
              }}
            >
              <img
                src={avatarSrc}
                alt={displayName}
                style={{
                  width: '100%',
                  height: 320,
                  objectFit: 'cover',
                  borderRadius: 14,
                }}
              />
              <p style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                {displayName}
              </p>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                style={{
                  marginTop: 12,
                  padding: '8px 20px',
                  borderRadius: 8,
                  background: 'var(--primary, #6366f1)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Preview
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileAvatar;
