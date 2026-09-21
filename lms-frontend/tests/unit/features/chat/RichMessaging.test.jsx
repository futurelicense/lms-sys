import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MessageItem from '../../../../src/features/chat/components/MessageItem';
import PinnedMessagesBar from '../../../../src/features/chat/components/PinnedMessagesBar';
import MessageComposer from '../../../../src/features/chat/components/MessageComposer';
import { formatLastSeenTime } from '../../../../src/features/chat/hooks/usePresence';

describe('Phase 3: Rich Messaging & Presence', () => {
  describe('formatLastSeenTime', () => {
    it('returns Offline when timestamp is missing', () => {
      expect(formatLastSeenTime(null)).toBe('Offline');
      expect(formatLastSeenTime(undefined)).toBe('Offline');
    });

    it('returns "Last seen just now" for timestamps within a minute', () => {
      const now = new Date(Date.now() - 10 * 1000).toISOString();
      expect(formatLastSeenTime(now)).toBe('Last seen just now');
    });

    it('returns minutes ago for timestamps within an hour', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatLastSeenTime(fiveMinAgo)).toBe('Last seen 5m ago');
    });

    it('returns hours ago for timestamps within 24 hours', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(formatLastSeenTime(threeHoursAgo)).toBe('Last seen 3h ago');
    });
  });

  describe('MessageItem: Reactions & Mentions & Pins', () => {
    const mockMessage = {
      id: 'msg-phase3-1',
      sender_id: 'user-alice',
      sender_name: 'Alice',
      content: 'Hello @Bob check this out!',
      created_at: new Date().toISOString(),
      reactions: [
        { reaction: '👍', count: 3, users: ['user-bob', 'user-charlie', 'user-me'] },
        { reaction: '❤️', count: 1, users: ['user-bob'] },
      ],
    };

    it('renders @mention highlight tags in message content', () => {
      render(
        <MessageItem
          message={mockMessage}
          currentUser={{ id: 'user-me' }}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const mentionTag = screen.getByText('@Bob');
      expect(mentionTag).toBeInTheDocument();
      expect(mentionTag).toHaveClass('chat-mention-tag');
    });

    it('renders reaction chips with counts and active state for user reactions', () => {
      const onToggleReaction = vi.fn();
      render(
        <MessageItem
          message={mockMessage}
          currentUser={{ id: 'user-me' }}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggleReaction={onToggleReaction}
        />
      );

      // Thumbs up chip
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // Heart chip
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();

      // Clicking a reaction calls onToggleReaction
      fireEvent.click(screen.getByText('👍').closest('.chat-reaction-chip'));
      expect(onToggleReaction).toHaveBeenCalledWith('msg-phase3-1', '👍');
    });

    it('opens inline reaction picker on clicking Add reaction and triggers onToggleReaction', () => {
      const onToggleReaction = vi.fn();
      render(
        <MessageItem
          message={mockMessage}
          currentUser={{ id: 'user-me' }}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggleReaction={onToggleReaction}
        />
      );

      // Hover message to reveal action bar
      fireEvent.mouseEnter(screen.getByText('Alice').closest('.chat-message'));
      const addReactionBtn = screen.getByTitle('Add reaction');
      expect(addReactionBtn).toBeInTheDocument();

      // Click Add reaction to expand inline reaction bar
      fireEvent.click(addReactionBtn);
      const partyEmoji = screen.getByTitle('React with 🎉');
      expect(partyEmoji).toBeInTheDocument();

      // Click emoji to react
      fireEvent.click(partyEmoji);
      expect(onToggleReaction).toHaveBeenCalledWith('msg-phase3-1', '🎉');
    });

    it('renders pinned badge and triggers onUnpin / onPin for moderators', () => {
      const onPin = vi.fn();
      const onUnpin = vi.fn();

      const { rerender } = render(
        <MessageItem
          message={mockMessage}
          currentUser={{ id: 'user-admin', roles: ['ADMIN'] }}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onPin={onPin}
          onUnpin={onUnpin}
          isPinned={true}
        />
      );

      // Verify pinned badge
      expect(screen.getByText('📌 Pinned')).toBeInTheDocument();

      // Hover to reveal action bar
      fireEvent.mouseEnter(screen.getByText('Alice').closest('.chat-message'));
      const unpinBtn = screen.getByTitle('Unpin message');
      expect(unpinBtn).toBeInTheDocument();
      fireEvent.click(unpinBtn);
      expect(onUnpin).toHaveBeenCalledWith('msg-phase3-1');

      // Now test pinning when not pinned
      rerender(
        <MessageItem
          message={mockMessage}
          currentUser={{ id: 'user-admin', roles: ['ADMIN'] }}
          onReply={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onPin={onPin}
          onUnpin={onUnpin}
          isPinned={false}
        />
      );

      fireEvent.mouseEnter(screen.getByText('Alice').closest('.chat-message'));
      const pinBtn = screen.getByTitle('Pin message');
      expect(pinBtn).toBeInTheDocument();
      fireEvent.click(pinBtn);
      expect(onPin).toHaveBeenCalledWith('msg-phase3-1');
    });
  });

  describe('PinnedMessagesBar', () => {
    const pinnedMessages = [
      {
        id: 'msg-pin-1',
        message_id: 'msg-pin-1',
        content: 'Important syllabus announcement',
        sender_name: 'Professor Smith',
      },
      {
        id: 'msg-pin-2',
        message_id: 'msg-pin-2',
        content: 'Final exam date is next Friday',
        sender_name: 'Teaching Assistant',
      },
    ];

    it('renders pinned snippet and jump button', () => {
      const onJump = vi.fn();
      const onUnpin = vi.fn();

      render(
        <PinnedMessagesBar
          pinnedMessages={pinnedMessages}
          onJumpToMessage={onJump}
          onUnpin={onUnpin}
          canUnpin={true}
        />
      );

      expect(screen.getByText(/Important syllabus announcement/)).toBeInTheDocument();
      expect(screen.getByText(/Professor Smith/)).toBeInTheDocument();

      const jumpBtn = screen.getByRole('button', { name: /jump/i });
      fireEvent.click(jumpBtn);
      expect(onJump).toHaveBeenCalledWith('msg-pin-1');
    });

    it('triggers onUnpin when unpin button is clicked', () => {
      const onUnpin = vi.fn();
      render(
        <PinnedMessagesBar
          pinnedMessages={pinnedMessages}
          onJumpToMessage={vi.fn()}
          onUnpin={onUnpin}
          canUnpin={true}
        />
      );

      const unpinBtn = screen.getByLabelText('Unpin');
      fireEvent.click(unpinBtn);
      expect(onUnpin).toHaveBeenCalledWith('msg-pin-1');
    });
  });

  describe('MessageComposer: Archived State & Mentions', () => {
    it('shows read-only archived indicator when isArchived is true', () => {
      render(
        <MessageComposer
          onSend={vi.fn()}
          onTyping={vi.fn()}
          isArchived={true}
        />
      );

      expect(
        screen.getByText(/This channel has been archived and is read-only/i)
      ).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Type a message/i)).not.toBeInTheDocument();
    });

    it('suggests only the other person in direct message channels', () => {
      const channel = { id: 'dm-1', type: 'DIRECT', otherUserName: 'Alice Smith', otherUserId: 'u-alice' };
      const members = [
        { user_id: 'u-alice', name: 'Alice Smith', email: 'alice@example.com' },
        { user_id: 'u-me', name: 'Vinoth', email: 'vinoth@example.com' },
      ];

      render(
        <MessageComposer
          onSend={vi.fn()}
          onTyping={vi.fn()}
          channel={channel}
          currentUser={{ id: 'u-me' }}
          members={members}
        />
      );

      // Trigger mention by typing @
      const input = screen.getByPlaceholderText(/Type a message/i);
      fireEvent.change(input, { target: { value: 'Hey @' } });

      // Popover should show Alice Smith but NOT @everyone and NOT Vinoth
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.queryByText('@everyone')).not.toBeInTheDocument();
      expect(screen.queryByText('vinoth@example.com')).not.toBeInTheDocument();
    });

    it('suggests @everyone and all group members in group/course channels', () => {
      const channel = { id: 'grp-1', type: 'GROUP', name: 'FullStack Developers' };
      const members = [
        { user_id: 'u-alice', name: 'Alice', email: 'alice@example.com' },
        { user_id: 'u-bob', name: 'Bob', email: 'bob@example.com' },
        { user_id: 'u-me', name: 'Vinoth', email: 'vinoth@example.com' },
      ];

      render(
        <MessageComposer
          onSend={vi.fn()}
          onTyping={vi.fn()}
          channel={channel}
          currentUser={{ id: 'u-me' }}
          members={members}
        />
      );

      const input = screen.getByPlaceholderText(/Type a message/i);
      fireEvent.change(input, { target: { value: '@' } });

      // Should show @everyone first, then members Alice and Bob (Vinoth excluded)
      expect(screen.getByText('@everyone')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('vinoth@example.com')).not.toBeInTheDocument();
    });

    it('opens mention popover when typing @ in composer', () => {
      const channel = { id: 'course-1', type: 'COURSE', name: 'React 101' };
      const members = [
        { user_id: 'u-alice', name: 'Alice', email: 'alice@example.com' },
      ];

      render(
        <MessageComposer
          onSend={vi.fn()}
          onTyping={vi.fn()}
          channel={channel}
          currentUser={{ id: 'u-me' }}
          members={members}
        />
      );

      const input = screen.getByPlaceholderText(/Type a message/i);
      fireEvent.change(input, { target: { value: '@' } });

      expect(screen.getByText('@everyone')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('shows empty message when mention query has no matches', () => {
      const channel = { id: 'grp-1', type: 'GROUP', name: 'General' };
      render(
        <MessageComposer
          onSend={vi.fn()}
          onTyping={vi.fn()}
          channel={channel}
          currentUser={{ id: 'u-me' }}
          members={[{ user_id: 'u-alice', name: 'Alice' }]}
        />
      );

      const input = screen.getByPlaceholderText(/Type a message/i);
      fireEvent.change(input, { target: { value: '@xyznotfound' } });

      expect(screen.getByText(/No members matching/i)).toBeInTheDocument();
    });

    it('extracts members from recent messages as fallback when members array is empty', () => {
      const channel = { id: 'dm-2', type: 'DIRECT' };
      const messages = [
        { id: 'm-1', sender_id: 'u-vinoth-admin', sender_name: 'Vinoth_admin', sender_email: 'admin@lms.com' },
      ];

      render(
        <MessageComposer
          onSend={vi.fn()}
          onTyping={vi.fn()}
          channel={channel}
          currentUser={{ id: 'u-me' }}
          messages={messages}
        />
      );

      const input = screen.getByPlaceholderText(/Type a message/i);
      fireEvent.change(input, { target: { value: '@V' } });

      expect(screen.getByText('Vinoth_admin')).toBeInTheDocument();
    });
  });
});
