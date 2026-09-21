import { useEffect, useId, useRef, useState } from 'react';
import { Camera, Upload, Trash2, User, AlertCircle, Loader2 } from 'lucide-react';
import { PHOTO_ACCEPT, PHOTO_MAX_BYTES } from '../../../constants/personConstants';
import { initials } from '../../../utils/formatUtils';
import Button from '../Button';
import styles from './PhotoUploadField.module.css';

const ACCEPTED = PHOTO_ACCEPT.split(',');

/**
 * Modern profile avatar & drag-and-drop photo field.
 *
 * Controlled on the storage key, not the file: the upload happens as soon as a
 * file is picked, and the form only ever carries the key the API expects.
 * Shows high-resolution avatar preview, initials fallback, and responsive controls.
 */
export const PhotoUploadField = ({
  label = 'Learner Photo',
  name = '',
  value,
  initialUrl = '',
  onChange,
  onUpload,
  required = false,
  error,
  hint,
  className = '',
}) => {
  const inputRef = useRef(null);
  const inputId = useId();

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [preview, setPreview] = useState(null);

  // Object URLs are revoked on replace and on unmount to prevent blob leaks
  useEffect(() => () => preview && URL.revokeObjectURL(preview.url), [preview]);

  const reject = (message) => {
    setUploadError(message);
    setUploading(false);
  };

  const handleFile = async (file) => {
    if (!file) return;

    setUploadError(null);

    if (!ACCEPTED.includes(file.type)) {
      reject('Use a PNG, JPEG or WebP image');
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      reject(`Image must be under ${Math.round(PHOTO_MAX_BYTES / 1024 / 1024)}MB`);
      return;
    }

    setUploading(true);
    try {
      const photoKey = await onUpload(file);
      setPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous.url);
        return { url: URL.createObjectURL(file), name: file.name };
      });
      onChange(photoKey);
    } catch (cause) {
      reject(cause.message || 'Upload failed, try again');
    } finally {
      setUploading(false);
    }
  };

  const clear = (event) => {
    event.stopPropagation();
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous.url);
      return null;
    });
    setUploadError(null);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const shown = error || uploadError;
  const displayUrl = preview?.url || (value ? initialUrl : null);
  const hasPhoto = Boolean(displayUrl);
  const userInitials = initials(name);

  const containerClasses = [
    styles.card,
    dragging ? styles.dragging : '',
    shown ? styles.invalid : '',
    uploading ? styles.busy : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.fieldWrapper}>
      <div
        className={containerClasses}
        role="region"
        aria-label={label}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {/* Avatar Display Box with Camera Hover Overlay */}
        <div
          className={styles.avatarWrap}
          onClick={() => !uploading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          title={hasPhoto ? 'Click to change photo' : 'Click to upload photo'}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          {hasPhoto ? (
            <img className={styles.avatarImg} src={displayUrl} alt={name || label} />
          ) : userInitials ? (
            <span className={styles.avatarInitials}>{userInitials}</span>
          ) : (
            <User className={styles.placeholderIcon} size={34} />
          )}

          {/* Interactive Hover Overlay */}
          <div className={styles.hoverOverlay} aria-hidden="true">
            <Camera size={18} />
            <span className={styles.hoverText}>{hasPhoto ? 'Change' : 'Upload'}</span>
          </div>

          {uploading && (
            <div className={styles.uploadingOverlay}>
              <Loader2 className={styles.spinner} size={22} />
            </div>
          )}
        </div>

        {/* Info & Action Controls */}
        <div className={styles.details}>
          <div className={styles.headerRow}>
            <span className={styles.label}>{label}</span>
            {required ? (
              <span className={styles.required}>* Required</span>
            ) : (
              <span className={styles.badge}>Optional</span>
            )}
          </div>

          <p className={styles.hint}>
            {dragging
              ? 'Drop the image file right here'
              : hint || 'PNG, JPG or WebP up to 5MB. Square photo recommended for ID cards.'}
          </p>

          <div className={styles.actionRow}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={uploading ? <Loader2 className={styles.spinner} size={14} /> : <Upload size={14} />}
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Uploading…' : hasPhoto ? 'Change photo' : 'Upload photo'}
            </Button>

            {hasPhoto && !uploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={styles.removeBtn}
                leftIcon={<Trash2 size={14} />}
                onClick={clear}
                aria-label={`Remove ${label}`}
              >
                Remove
              </Button>
            )}

            <span className={styles.dropPrompt}>or drag &amp; drop</span>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="u-hidden"
        accept={PHOTO_ACCEPT}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {shown && (
        <div className={styles.error} id={`${inputId}-error`} role="alert">
          <AlertCircle size={14} />
          <span>{shown}</span>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadField;
