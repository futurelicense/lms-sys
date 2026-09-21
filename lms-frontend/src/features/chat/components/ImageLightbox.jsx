import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Download, RotateCcw, ExternalLink } from 'lucide-react';

/**
 * ImageLightbox — sleek full-screen image viewer with zoom, download, and keyboard navigation.
 */
export default function ImageLightbox({ isOpen, src, alt, name, onClose }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(s + 0.25, 3));
      if (e.key === '-' || e.key === '_') setScale((s) => Math.max(s - 0.25, 0.5));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  return createPortal(
    <div
      className="chat-lightbox-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div className="chat-lightbox-header">
        <span className="chat-lightbox-title">{name || alt || 'Image Preview'}</span>
        <div className="chat-lightbox-controls">
          <button
            type="button"
            className="chat-lightbox-btn"
            onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            className="chat-lightbox-btn"
            onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            type="button"
            className="chat-lightbox-btn"
            onClick={() => setScale(1)}
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
          <a
            href={src}
            download={name || 'image'}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-lightbox-btn"
            title="Download image"
            aria-label="Download image"
          >
            <Download size={18} />
          </a>
          <button
            type="button"
            className="chat-lightbox-btn chat-lightbox-btn--close"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close preview (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="chat-lightbox-stage">
        <img
          src={src}
          alt={alt || name || 'Full preview'}
          className="chat-lightbox-image"
          style={{ transform: `scale(${scale})` }}
          draggable={false}
        />
      </div>
    </div>,
    document.body
  );
}
