import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NotificationsPage } from '@/pages/app/NotificationsPage';
import { NotificationDropdown } from '@/features/notifications/components/NotificationDropdown';
import { notificationService } from '@/features/notifications/services/notificationService';
import { AuthProvider } from '@/features/auth';
import type { NotificationResponse, UnreadCountResponse } from '@/features/notifications/types';
import type { Page } from '@/types/api';
import type { User } from '@/types/auth';

vi.mock('@/features/notifications/services/notificationService', () => ({
  notificationService: {
    getMyNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

describe('In-App Notification Center & Real-time Alerts', () => {
  const studentUser: User = {
    id: 'student-1',
    email: 'dinuka.20@uom.lk',
    fullName: 'Dinuka Jayasuriya',
    role: 'STUDENT',
  };

  const mockNotifications: NotificationResponse[] = [
    {
      id: 'notif-1',
      notificationType: 'CLAIM_APPROVED',
      title: 'Claim Approved — Ready for Collection',
      message: 'Your claim on "Casio fx-991EX Calculator" has been approved. Please visit Central Security Office.',
      relatedEntityType: 'CLAIM',
      relatedEntityId: 'claim-101',
      isRead: false,
      readAt: null,
      createdAt: '2026-11-18T10:00:00Z',
    },
    {
      id: 'notif-2',
      notificationType: 'FOUND_ITEM_HANDOVER_CONFIRMED',
      title: 'Item Handover Verified',
      message: 'Officer Suneth confirmed receipt of your reported item. 10 reputation points awarded.',
      relatedEntityType: 'FOUND_ITEM',
      relatedEntityId: 'item-202',
      isRead: false,
      readAt: null,
      createdAt: '2026-11-18T09:30:00Z',
    },
    {
      id: 'notif-3',
      notificationType: 'REPUTATION_AWARDED',
      title: 'Community Reputation Awarded',
      message: 'You earned +10 reputation points for handing over a found item to the Security Office.',
      relatedEntityType: 'REPUTATION',
      relatedEntityId: null,
      isRead: true,
      readAt: '2026-11-18T09:35:00Z',
      createdAt: '2026-11-18T09:31:00Z',
    },
  ];

  const mockPageData: Page<NotificationResponse> = {
    content: mockNotifications,
    totalElements: 3,
    totalPages: 1,
    size: 15,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  const mockUnreadData: UnreadCountResponse = {
    unreadCount: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notifications page with category icons, unread badges, and action buttons', async () => {
    vi.mocked(notificationService.getMyNotifications).mockResolvedValue(mockPageData);
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(mockUnreadData);

    render(
      <AuthProvider initialUser={studentUser} initialToken="mock-token">
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Claim Approved — Ready for Collection')).toBeInTheDocument();
    });

    expect(screen.getByText('Item Handover Verified')).toBeInTheDocument();
    expect(screen.getByText('Community Reputation Awarded')).toBeInTheDocument();

    // Verify unread count badge in tab filter
    expect(screen.getByText('Unread Only')).toBeInTheDocument();
    expect(screen.getByText('Mark all as read')).toBeInTheDocument();
  });

  it('filters notifications by Unread tab and displays unread items only', async () => {
    vi.mocked(notificationService.getMyNotifications).mockResolvedValue(mockPageData);
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(mockUnreadData);
    const user = userEvent.setup();

    render(
      <AuthProvider initialUser={studentUser} initialToken="mock-token">
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Claim Approved — Ready for Collection')).toBeInTheDocument();
    });

    // Click Unread tab
    await user.click(screen.getByText('Unread Only'));

    // Read item should not be visible
    expect(screen.getByText('Claim Approved — Ready for Collection')).toBeInTheDocument();
    expect(screen.getByText('Item Handover Verified')).toBeInTheDocument();
    expect(screen.queryByText('Community Reputation Awarded')).not.toBeInTheDocument();
  });

  it('marks a single notification as read on button click', async () => {
    vi.mocked(notificationService.getMyNotifications).mockResolvedValue(mockPageData);
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(mockUnreadData);
    vi.mocked(notificationService.markAsRead).mockResolvedValue({
      ...mockNotifications[0],
      isRead: true,
      readAt: '2026-11-18T10:05:00Z',
    });

    const user = userEvent.setup();

    render(
      <AuthProvider initialUser={studentUser} initialToken="mock-token">
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Claim Approved — Ready for Collection')).toBeInTheDocument();
    });

    const markReadButtons = screen.getAllByTitle('Mark as read');
    expect(markReadButtons.length).toBeGreaterThan(0);

    await user.click(markReadButtons[0]);

    expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('marks all notifications as read when Mark all as read button is clicked', async () => {
    vi.mocked(notificationService.getMyNotifications).mockResolvedValue(mockPageData);
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(mockUnreadData);
    vi.mocked(notificationService.markAllAsRead).mockResolvedValue();

    const user = userEvent.setup();

    render(
      <AuthProvider initialUser={studentUser} initialToken="mock-token">
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Mark all as read')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Mark all as read'));

    expect(notificationService.markAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('renders header NotificationDropdown with unread badge and opens preview popover', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue({ unreadCount: 2 });
    vi.mocked(notificationService.getMyNotifications).mockResolvedValue({
      ...mockPageData,
      content: mockNotifications.slice(0, 2),
    });

    const user = userEvent.setup();

    render(
      <AuthProvider initialUser={studentUser} initialToken="mock-token">
        <MemoryRouter>
          <NotificationDropdown />
        </MemoryRouter>
      </AuthProvider>
    );

    // Verify unread badge in bell button
    await waitFor(() => {
      expect(screen.getByLabelText(/Notifications \(2 unread\)/i)).toBeInTheDocument();
    });

    const bellBtn = screen.getByLabelText(/Notifications \(2 unread\)/i);
    await user.click(bellBtn);

    // Popover opens
    await waitFor(() => {
      expect(screen.getByText('View all notifications')).toBeInTheDocument();
    });

    expect(screen.getByText('Claim Approved — Ready for Collection')).toBeInTheDocument();
    expect(screen.getByText('Item Handover Verified')).toBeInTheDocument();
  });

  it('displays empty state when user has no unread notifications', async () => {
    vi.mocked(notificationService.getMyNotifications).mockResolvedValue({
      ...mockPageData,
      content: [mockNotifications[2]], // Only read item
      totalElements: 1,
    });
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue({ unreadCount: 0 });

    const user = userEvent.setup();

    render(
      <AuthProvider initialUser={studentUser} initialToken="mock-token">
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Reputation Awarded')).toBeInTheDocument();
    });

    // Switch to unread filter
    await user.click(screen.getByText('Unread Only'));

    expect(screen.getByText('All Caught Up!')).toBeInTheDocument();
  });
});
