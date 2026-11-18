import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from './NotificationItem';
import { ROUTES } from '@/routes/paths';
import type { NotificationResponse } from '../types';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const { unreadCount, refresh: refreshUnreadCount, decrement, reset: resetUnreadCount } = useUnreadCount();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchRecent = async () => {
      try {
        setIsLoadingList(true);
        const data = await notificationService.getMyNotifications(0, 5);
        if (isMounted) {
          setNotifications(data.content);
        }
      } catch {
        // Handled silently in dropdown preview
      } finally {
        if (isMounted) {
          setIsLoadingList(false);
        }
      }
    };

    fetchRecent();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      decrement();
    } catch {
      // Keep UI state if failed
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetUnreadCount();
    } catch {
      // Keep UI state if failed
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          refreshUnreadCount();
        }}
        className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-600 transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
          role="region"
          aria-label="Recent notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-campus-700 hover:text-campus-900 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
            {isLoadingList ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-campus-600" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto h-7 w-7 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You'll be alerted when items, handovers, or claims change.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  compact
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/80 p-2.5 text-center">
            <Link
              to={ROUTES.APP.NOTIFICATIONS}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-campus-800 hover:text-campus-950 transition-colors w-full py-1"
            >
              <span>View all notifications</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
