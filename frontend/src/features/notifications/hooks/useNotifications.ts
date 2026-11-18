import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { notifyNotificationsUpdated } from './useUnreadCount';
import type { NotificationResponse } from '../types';

export function useNotifications(initialPage = 0, initialSize = 20) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [size, setSize] = useState<number>(initialSize);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [isMutating, setIsMutating] = useState<boolean>(false);

  const fetchNotifications = useCallback(
    async (targetPage = page, targetSize = size) => {
      try {
        setIsLoading(true);
        setError(null);

        const [pageData, countData] = await Promise.all([
          notificationService.getMyNotifications(targetPage, targetSize),
          notificationService.getUnreadCount(),
        ]);

        setNotifications(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
        setPage(pageData.number);
        setUnreadCount(countData.unreadCount);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load notifications';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [page, size]
  );

  useEffect(() => {
    fetchNotifications(page, size);
  }, [fetchNotifications, page, size]);

  const markAsRead = async (notificationId: string) => {
    try {
      setIsMutating(true);
      const updated = await notificationService.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? updated : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      notifyNotificationsUpdated();
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark as read';
      setError(msg);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsMutating(true);
      await notificationService.markAllAsRead();

      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || now }))
      );
      setUnreadCount(0);
      notifyNotificationsUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark all as read';
      setError(msg);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const filteredNotifications =
    filter === 'UNREAD' ? notifications.filter((n) => !n.isRead) : notifications;

  return {
    notifications: filteredNotifications,
    rawNotifications: notifications,
    unreadCount,
    isLoading,
    error,
    page,
    size,
    totalPages,
    totalElements,
    filter,
    isMutating,
    setFilter,
    setPage,
    setSize,
    markAsRead,
    markAllAsRead,
    refresh: () => fetchNotifications(page, size),
  };
}
