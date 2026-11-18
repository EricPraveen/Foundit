import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '@/features/auth';

export const NOTIFICATIONS_UPDATED_EVENT = 'campusfind:notifications-updated';

export function notifyNotificationsUpdated(): void {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
}

export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.unreadCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch unread count';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();

    const handleUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    };
  }, [fetchUnreadCount]);

  const decrement = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    isLoading,
    error,
    refresh: fetchUnreadCount,
    decrement,
    reset,
  };
}
