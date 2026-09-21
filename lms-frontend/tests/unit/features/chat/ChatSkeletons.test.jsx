import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  SidebarSkeleton,
  MessageFeedSkeleton,
  ChannelHeaderSkeleton,
  MemberRosterSkeleton,
  UserListSkeleton,
} from '../../../../src/features/chat/components/ChatSkeletons';

describe('Chat Skeleton Components', () => {
  it('renders SidebarSkeleton with aria-label and skeleton rows', () => {
    render(<SidebarSkeleton />);
    const sidebar = screen.getByLabelText('Loading channels');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar.querySelectorAll('.chat-channel-item-skeleton').length).toBe(6);
  });

  it('renders MessageFeedSkeleton with requested number of message rows', () => {
    render(<MessageFeedSkeleton count={4} />);
    const feed = screen.getByLabelText('Loading messages');
    expect(feed).toBeInTheDocument();
    expect(feed.querySelectorAll('.chat-message-skeleton').length).toBe(4);
  });

  it('renders ChannelHeaderSkeleton with header placeholders', () => {
    render(<ChannelHeaderSkeleton />);
    const header = screen.getByLabelText('Loading channel info');
    expect(header).toBeInTheDocument();
  });

  it('renders MemberRosterSkeleton with correct count', () => {
    render(<MemberRosterSkeleton count={3} />);
    const roster = screen.getByLabelText('Loading members');
    expect(roster).toBeInTheDocument();
    expect(roster.querySelectorAll('.chat-roster-item-skeleton').length).toBe(3);
  });

  it('renders UserListSkeleton with action buttons', () => {
    render(<UserListSkeleton count={5} />);
    const list = screen.getByLabelText('Loading users');
    expect(list).toBeInTheDocument();
    expect(list.querySelectorAll('.chat-user-item-skeleton').length).toBe(5);
  });
});
