import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatSidebar from '../../../../src/features/chat/components/ChatSidebar';
import { CHANNEL_TYPES } from '../../../../src/features/chat/constants/chatConstants';

// Mock useAuth
vi.mock('../../../../src/features/auth/hooks/useAuth', () => ({
  default: () => ({
    user: { id: 'current-user-uuid', name: 'Current User', email: 'me@example.com' },
  }),
}));

describe('ChatSidebar - Direct Messages and Channel Names', () => {
  const dummyDirectChannels = [
    {
      id: 'dm-1',
      type: CHANNEL_TYPES.DIRECT,
      displayName: 'Vinoth_admin',
      otherUserId: 'user-2-uuid',
    },
    {
      id: 'dm-2',
      type: CHANNEL_TYPES.DIRECT,
      display_name: 'Alex Rivera',
      other_user_id: 'user-3-uuid',
    },
    {
      id: 'dm-3',
      type: CHANNEL_TYPES.DIRECT,
      members: [
        { user_id: 'current-user-uuid', name: 'Current User' },
        { user_id: 'user-4-uuid', name: 'Dr. Rajesh Kumar' },
      ],
    },
  ];

  it('renders actual contact names for Direct Messages instead of "Direct Message"', () => {
    render(
      <ChatSidebar
        channels={dummyDirectChannels}
        activeChannelId="dm-1"
        onSelectChannel={vi.fn()}
      />
    );

    // Verify actual names are displayed
    expect(screen.getByText('Vinoth_admin')).toBeInTheDocument();
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('Dr. Rajesh Kumar')).toBeInTheDocument();

    // Verify "Direct Message" is NOT rendered as channel item name
    const itemNames = screen.queryAllByText('Direct Message');
    expect(itemNames).toHaveLength(0);
  });

  it('filters direct channels by contact name in search', () => {
    render(
      <ChatSidebar
        channels={dummyDirectChannels}
        activeChannelId="dm-1"
        onSelectChannel={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search channels...');
    fireEvent.change(searchInput, { target: { value: 'Rivera' } });

    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.queryByText('Vinoth_admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Dr. Rajesh Kumar')).not.toBeInTheDocument();
  });

  it('displays online presence dot when user is online', () => {
    const mockPresence = {
      isOnline: (id) => id === 'user-2-uuid',
    };

    render(
      <ChatSidebar
        channels={dummyDirectChannels}
        activeChannelId="dm-1"
        onSelectChannel={vi.fn()}
        presence={mockPresence}
      />
    );

    expect(screen.getByTitle('Online')).toBeInTheDocument();
  });
});
