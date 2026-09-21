import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatSearchModal from '../../../../src/features/chat/components/ChatSearchModal';
import chatService from '../../../../src/features/chat/services/chatService';

vi.mock('../../../../src/features/chat/services/chatService', () => ({
  default: {
    searchMessages: vi.fn(),
  },
}));

describe('ChatSearchModal Component', () => {
  const activeChannel = {
    id: 'chan-1',
    name: 'general',
    type: 'PUBLIC',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open with search input and scope tabs', () => {
    render(
      <ChatSearchModal
        isOpen={true}
        onClose={vi.fn()}
        activeChannel={activeChannel}
        onSelectResult={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/Search messages, links, code/i)).toBeInTheDocument();
    expect(screen.getByText(/In #general/i)).toBeInTheDocument();
    expect(screen.getByText('All Channels')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ChatSearchModal
        isOpen={false}
        onClose={vi.fn()}
        activeChannel={activeChannel}
        onSelectResult={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('triggers search debounced and displays results with highlighted query match', async () => {
    chatService.searchMessages.mockResolvedValueOnce([
      {
        id: 'msg-101',
        channel_id: 'chan-1',
        sender_name: 'Alice',
        content: 'Here is the project deadline update',
        created_at: new Date().toISOString(),
      },
    ]);

    render(
      <ChatSearchModal
        isOpen={true}
        onClose={vi.fn()}
        activeChannel={activeChannel}
        onSelectResult={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Search messages, links, code/i);
    fireEvent.change(input, { target: { value: 'deadline' } });

    await waitFor(() => {
      expect(chatService.searchMessages).toHaveBeenCalledWith({
        query: 'deadline',
        channelId: 'chan-1',
      });
    }, { timeout: 1000 });

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('deadline')).toHaveClass('chat-search-highlight');
    });
  });

  it('switches search scope when clicking "All Channels" tab', async () => {
    chatService.searchMessages.mockResolvedValue([]);

    render(
      <ChatSearchModal
        isOpen={true}
        onClose={vi.fn()}
        activeChannel={activeChannel}
        onSelectResult={vi.fn()}
      />
    );

    const allChannelsBtn = screen.getByText('All Channels');
    fireEvent.click(allChannelsBtn);

    const input = screen.getByPlaceholderText(/Search messages, links, code/i);
    fireEvent.change(input, { target: { value: 'meeting' } });

    await waitFor(() => {
      expect(chatService.searchMessages).toHaveBeenCalledWith({
        query: 'meeting',
        channelId: undefined,
      });
    }, { timeout: 1000 });
  });

  it('invokes onSelectResult and onClose when a result item is clicked', async () => {
    const onSelectResult = vi.fn();
    const onClose = vi.fn();

    chatService.searchMessages.mockResolvedValueOnce([
      {
        id: 'msg-202',
        channel_id: 'chan-1',
        sender_name: 'Bob',
        content: 'Important announcement today',
        created_at: new Date().toISOString(),
      },
    ]);

    render(
      <ChatSearchModal
        isOpen={true}
        onClose={onClose}
        activeChannel={activeChannel}
        onSelectResult={onSelectResult}
      />
    );

    const input = screen.getByPlaceholderText(/Search messages, links, code/i);
    fireEvent.change(input, { target: { value: 'announcement' } });

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    }, { timeout: 1000 });

    fireEvent.click(screen.getByText('Bob'));

    expect(onSelectResult).toHaveBeenCalledWith({
      channelId: 'chan-1',
      messageId: 'msg-202',
    });
    expect(onClose).toHaveBeenCalled();
  });
});
