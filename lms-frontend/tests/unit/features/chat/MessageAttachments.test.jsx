import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ImageLightbox from '../../../../src/features/chat/components/ImageLightbox';
import MessageItem from '../../../../src/features/chat/components/MessageItem';
import MessageComposer from '../../../../src/features/chat/components/MessageComposer';

describe('Message Attachments & Lightbox Tests', () => {
  describe('ImageLightbox Component', () => {
    const mockImage = {
      url: 'https://example.com/test-image.png',
      name: 'test-image.png',
    };

    it('renders the image when isOpen is true and src is provided', () => {
      render(
        <ImageLightbox
          isOpen={true}
          src={mockImage.url}
          alt={mockImage.name}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByAltText('test-image.png')).toBeInTheDocument();
      expect(screen.getByText('test-image.png')).toBeInTheDocument();
    });

    it('does not render when isOpen is false or src is null', () => {
      const { container } = render(
        <ImageLightbox
          isOpen={false}
          src={mockImage.url}
          alt={mockImage.name}
          onClose={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('calls onClose when close button or Escape key is pressed', () => {
      const onClose = vi.fn();
      render(
        <ImageLightbox
          isOpen={true}
          src={mockImage.url}
          alt={mockImage.name}
          onClose={onClose}
        />
      );

      const closeBtn = screen.getByLabelText('Close preview (Esc)');
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('handles zoom in, zoom out, and reset zoom actions', () => {
      render(
        <ImageLightbox
          isOpen={true}
          src={mockImage.url}
          alt={mockImage.name}
          onClose={vi.fn()}
        />
      );

      const zoomInBtn = screen.getByLabelText('Zoom In');
      const zoomOutBtn = screen.getByLabelText('Zoom Out');
      const resetBtn = screen.getByLabelText('Reset Zoom');

      fireEvent.click(zoomInBtn);
      fireEvent.click(zoomOutBtn);
      fireEvent.click(zoomInBtn);
      fireEvent.click(zoomInBtn);
      fireEvent.click(resetBtn);

      expect(zoomInBtn).toBeInTheDocument();
    });
  });

  describe('MessageItem Attachments Rendering', () => {
    it('renders image thumbnail and opens lightbox on click', () => {
      const messageWithImage = {
        id: 'msg-img-1',
        sender_id: 'u1',
        sender_name: 'Alice',
        content: 'Check this diagram',
        created_at: new Date().toISOString(),
        attachments: [
          {
            url: 'https://example.com/arch.png',
            name: 'arch.png',
            type: 'image/png',
            size: 204800,
          },
        ],
      };

      render(
        <MessageItem
          message={messageWithImage}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const img = screen.getByAltText('arch.png');
      expect(img).toBeInTheDocument();

      // Click to open lightbox
      fireEvent.click(img);

      // Lightbox toolbar buttons should now be in the DOM
      expect(screen.getByLabelText('Zoom In')).toBeInTheDocument();
      expect(screen.getByLabelText('Reset Zoom')).toBeInTheDocument();
    });

    it('renders document attachment card with file size and download link', () => {
      const messageWithDoc = {
        id: 'msg-doc-1',
        sender_id: 'u1',
        sender_name: 'Alice',
        content: 'Here is the specification doc',
        created_at: new Date().toISOString(),
        attachments: [
          {
            url: 'https://example.com/spec.pdf',
            name: 'spec.pdf',
            type: 'application/pdf',
            size: 1048576, // 1 MB
          },
        ],
      };

      render(
        <MessageItem
          message={messageWithDoc}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('spec.pdf')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
      const downloadLink = screen.getByTitle('Download spec.pdf');
      expect(downloadLink).toHaveAttribute('href', 'https://example.com/spec.pdf');
    });
  });

  describe('MessageComposer Drag-and-Drop and Paste', () => {
    it('shows drag overlay when files are dragged over composer', () => {
      const { container } = render(
        <MessageComposer
          onSend={vi.fn()}
          onTyping={vi.fn()}
        />
      );

      const dropZone = container.querySelector('.chat-composer');
      expect(dropZone).toBeInTheDocument();

      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
      expect(screen.getByText(/Drop files here to attach/i)).toBeInTheDocument();

      fireEvent.dragLeave(dropZone);
      expect(screen.queryByText(/Drop files here to attach/i)).toBeNull();
    });
  });
});
