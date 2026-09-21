import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MessageItem from '../../../../src/features/chat/components/MessageItem';

describe('MessageItem (Phase 2 Reliable Messaging)', () => {
  const baseMessage = {
    id: 'msg-1',
    sender_id: 'user-1',
    sender_name: 'Alice',
    content: 'Hello team!',
    created_at: new Date().toISOString(),
    attachments: [],
  };

  it('renders message content and sender name', () => {
    render(<MessageItem message={baseMessage} onReply={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Hello team!')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders quoted reply context with author and snippet', () => {
    const replyMessage = {
      ...baseMessage,
      id: 'msg-2',
      sender_name: 'Bob',
      content: 'I agree with this',
      replyToMessageId: 'msg-1',
      replyToSenderName: 'Alice',
      replyToContent: 'Hello team!',
    };

    render(<MessageItem message={replyMessage} onReply={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText('Hello team!')).toBeInTheDocument();
    expect(screen.getByText('I agree with this')).toBeInTheDocument();
  });

  it('shows (edited) badge when message was edited', () => {
    const editedMessage = {
      ...baseMessage,
      edited_at: new Date().toISOString(),
    };

    render(<MessageItem message={editedMessage} onReply={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });

  it('shows edit button only for message owner', () => {
    // Current user is owner
    const { rerender } = render(
      <MessageItem
        message={baseMessage}
        currentUser={{ id: 'user-1', roles: ['STUDENT'] }}
        onReply={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    fireEvent.mouseEnter(screen.getByText('Hello team!').closest('.chat-message'));
    expect(screen.getByTitle('Edit message')).toBeInTheDocument();

    // Another student (not owner)
    rerender(
      <MessageItem
        message={baseMessage}
        currentUser={{ id: 'user-2', roles: ['STUDENT'] }}
        onReply={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByTitle('Edit message')).not.toBeInTheDocument();
  });

  it('allows moderator to delete messages sent by other users', () => {
    render(
      <MessageItem
        message={baseMessage}
        currentUser={{ id: 'user-admin', roles: ['ADMIN'] }}
        onReply={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    fireEvent.mouseEnter(screen.getByText('Hello team!').closest('.chat-message'));
    expect(screen.getByTitle('Moderate Delete')).toBeInTheDocument();
    // Non-owner admin cannot edit
    expect(screen.queryByTitle('Edit message')).not.toBeInTheDocument();
  });

  it('renders soft-deleted message properly without action buttons', () => {
    const deletedMessage = {
      ...baseMessage,
      content: '[Message deleted]',
      deleted_at: new Date().toISOString(),
    };

    render(
      <MessageItem
        message={deletedMessage}
        currentUser={{ id: 'user-1', roles: ['STUDENT'] }}
        onReply={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('[Message deleted]')).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByText('[Message deleted]').closest('.chat-message'));
    expect(screen.queryByTitle('Reply')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Edit message')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });
});
