import { apiClient } from '@/lib/api';
import type { Page } from '@/types/api';
import type { NotificationResponse, UnreadCountResponse } from '../types';

export const notificationService = {
  /**
   * Retrieves an auditable, paginated list of personal notifications for the authenticated user, newest first.
   * GET /api/v1/notifications?page={page}&size={size}
   */
  async getMyNotifications(page = 0, size = 20): Promise<Page<NotificationResponse>> {
    return apiClient.get<Page<NotificationResponse>>('/notifications', {
      params: { page, size },
    });
  },

  /**
   * Retrieves the count of unread notifications for badge indicators.
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiClient.get<UnreadCountResponse>('/notifications/unread-count');
  },

  /**
   * Marks a specific notification as read. Idempotent and restricted to the notification owner.
   * PATCH /api/v1/notifications/{notificationId}/read
   */
  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    return apiClient.patch<NotificationResponse>(
      `/notifications/${notificationId}/read`
    );
  },

  /**
   * Marks all unread notifications belonging to the authenticated user as read.
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(): Promise<void> {
    return apiClient.patch<void>('/notifications/read-all');
  },
};
