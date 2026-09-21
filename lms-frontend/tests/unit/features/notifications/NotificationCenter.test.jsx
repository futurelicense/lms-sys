import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import NotificationDropdown from '../../../../src/features/notifications/components/NotificationDropdown';
import notificationService from '../../../../src/features/notifications/services/notificationService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../src/features/notifications/services/notificationService', () => ({
  default: {
    list: vi.fn().mockResolvedValue({ items: [] }),
    getUnreadCount: vi.fn().mockResolvedValue(0),
    markRead: vi.fn().mockResolvedValue({ success: true }),
    markAllRead: vi.fn().mockResolvedValue({ success: true }),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('NotificationCenter & Real-Time Popover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleNotifications = [
    {
      id: 'notif-1',
      type: 'CHAT_DM',
      title: 'Direct Message',
      message: 'Alice sent you a direct message',
      linkUrl: '/chat?channelId=dm-123',
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      type: 'CHAT_MENTION',
      title: 'Mentioned in #general',
      message: 'Bob mentioned you in a discussion',
      linkUrl: '/chat?channelId=chan-general',
      isRead: true,
      readAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-3',
      type: 'COURSE_PUBLISHED',
      title: 'New Course Available',
      message: 'Advanced React 2026 has been published',
      linkUrl: '/courses/react-2026',
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    },
  ];

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <NotificationDropdown
        isOpen={false}
        onClose={vi.fn()}
        notifications={sampleNotifications}
        unreadCount={2}
      />,
      { wrapper: createWrapper() }
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dropdown with title, count badge, and items when open', () => {
    render(
      <NotificationDropdown
        isOpen={true}
        onClose={vi.fn()}
        notifications={sampleNotifications}
        unreadCount={2}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Direct Message')).toBeInTheDocument();
    expect(screen.getByText('Mentioned in #general')).toBeInTheDocument();
    expect(screen.getByText('New Course Available')).toBeInTheDocument();
  });

  it('filters between All and Unread tabs correctly', () => {
    render(
      <NotificationDropdown
        isOpen={true}
        onClose={vi.fn()}
        notifications={sampleNotifications}
        unreadCount={2}
      />,
      { wrapper: createWrapper() }
    );

    // Click Unread tab
    const unreadTab = screen.getByRole('button', { name: /Unread/i });
    fireEvent.click(unreadTab);

    // Read item should not be visible
    expect(screen.getByText('Direct Message')).toBeInTheDocument();
    expect(screen.getByText('New Course Available')).toBeInTheDocument();
    expect(screen.queryByText('Mentioned in #general')).not.toBeInTheDocument();

    // Click All tab
    const allTab = screen.getByRole('button', { name: /^All/i });
    fireEvent.click(allTab);
    expect(screen.getByText('Mentioned in #general')).toBeInTheDocument();
  });

  it('navigates to linkUrl and marks notification read on click', async () => {
    const onClose = vi.fn();
    render(
      <NotificationDropdown
        isOpen={true}
        onClose={onClose}
        notifications={sampleNotifications}
        unreadCount={2}
      />,
      { wrapper: createWrapper() }
    );

    const firstItem = screen.getByText('Direct Message');
    fireEvent.click(firstItem);

    await vi.waitFor(() => {
      expect(notificationService.markRead).toHaveBeenCalledWith('notif-1');
    });
    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/chat?channelId=dm-123');
  });

  it('triggers markAllRead when "Mark all read" button is clicked', async () => {
    render(
      <NotificationDropdown
        isOpen={true}
        onClose={vi.fn()}
        notifications={sampleNotifications}
        unreadCount={2}
      />,
      { wrapper: createWrapper() }
    );

    const markAllBtn = screen.getByRole('button', { name: /Mark all read/i });
    fireEvent.click(markAllBtn);

    await vi.waitFor(() => {
      expect(notificationService.markAllRead).toHaveBeenCalled();
    });
  });

  it('navigates to /notifications when "View all in Notifications" footer is clicked', () => {
    const onClose = vi.fn();
    render(
      <NotificationDropdown
        isOpen={true}
        onClose={onClose}
        notifications={sampleNotifications}
        unreadCount={2}
      />,
      { wrapper: createWrapper() }
    );

    const viewAllBtn = screen.getByRole('button', { name: /View all in Notifications/i });
    fireEvent.click(viewAllBtn);

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });

  it('renders empty state when there are no notifications', () => {
    render(
      <NotificationDropdown
        isOpen={true}
        onClose={vi.fn()}
        notifications={[]}
        unreadCount={0}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('No notifications found')).toBeInTheDocument();
  });
});

describe('Header Notification Bell Integration', () => {
  it('renders bell button and toggles NotificationDropdown on click', async () => {
    notificationService.list.mockResolvedValueOnce({
      items: [
        {
          id: 'notif-header-1',
          type: 'CHAT_DM',
          title: 'Direct Message From Sarah',
          message: 'Can you check the assignment?',
          isRead: false,
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const { Header } = await import('../../../../src/components/layout/Header/Header');
    render(<Header title="Dashboard" />, { wrapper: createWrapper() });

    const bellBtn = screen.getByRole('button', { name: /Toggle notifications/i });
    expect(bellBtn).toBeInTheDocument();

    // Initially dropdown is not in DOM
    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument();

    // Click bell to open
    fireEvent.click(bellBtn);
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    // Click again to toggle close
    fireEvent.click(bellBtn);
    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument();
  });
});

describe('Microsoft Teams Style Notification Toast & Deduplication', () => {
  it('deduplicates notifications with the same ID', async () => {
    const { default: teamsToastService } = await import(
      '../../../../src/features/notifications/services/teamsToastService'
    );
    teamsToastService.clear();

    const notif = {
      id: 'notif-dup-1',
      type: 'CHAT_DM',
      title: 'Message from Vinoth',
      message: 'Hey',
      linkUrl: '/chat?channelId=dm-vinoth',
    };

    teamsToastService.show(notif);
    teamsToastService.show(notif); // Duplicate call

    expect(teamsToastService.toasts.length).toBe(1);
    expect(teamsToastService.toasts[0].message).toBe('Hey');
    teamsToastService.clear();
  });

  it('renders Teams notification card and opens inline reply on clicking Reply', async () => {
    const { default: TeamsNotificationHost } = await import(
      '../../../../src/features/notifications/components/TeamsNotificationToast'
    );
    const { default: teamsToastService } = await import(
      '../../../../src/features/notifications/services/teamsToastService'
    );
    const { act } = await import('@testing-library/react');
    teamsToastService.clear();

    render(<TeamsNotificationHost />, { wrapper: createWrapper() });

    // Push notification wrapped in act
    act(() => {
      teamsToastService.show({
        id: 'teams-toast-1',
        type: 'CHAT_DM',
        title: 'Message from Vinoth',
        message: 'Hey',
        linkUrl: '/chat?channelId=dm-vinoth',
        data: {
          channelId: 'dm-vinoth',
          senderName: 'Vinoth',
        },
      });
    });

    // Verify card content
    await vi.waitFor(() => {
      expect(screen.getByText('LMS Chat')).toBeInTheDocument();
    });
    expect(screen.getByText('Vinoth')).toBeInTheDocument();
    expect(screen.getByText('Hey')).toBeInTheDocument();

    // Verify Reply button exists and toggles inline reply
    const replyBtn = screen.getByRole('button', { name: /Reply/i });
    expect(replyBtn).toBeInTheDocument();

    fireEvent.click(replyBtn);

    // Reply input should be visible
    const replyInput = screen.getByPlaceholderText('Type a reply...');
    expect(replyInput).toBeInTheDocument();

    // Verify send button is present
    const sendBtn = screen.getByRole('button', { name: /Send reply/i });
    expect(sendBtn).toBeInTheDocument();

    teamsToastService.clear();
  });
});


