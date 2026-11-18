import React from 'react';
import { Bell, CheckCheck, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNotifications, NotificationItem } from '@/features/notifications';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    page,
    totalPages,
    totalElements,
    filter,
    isMutating,
    setFilter,
    setPage,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications(0, 15);

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-campus-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            In-app alerts for physical handovers, claims review, collections, and reputation rewards.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={isMutating}
            className="self-start sm:self-auto gap-1.5"
            aria-label="Mark all notifications as read"
          >
            {isMutating ? (
              <Loader2 className="h-4 w-4 animate-spin text-campus-700" />
            ) : (
              <CheckCheck className="h-4 w-4 text-campus-700" />
            )}
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" title="Error Loading Notifications" className="mb-6">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-4">
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="flex space-x-6" aria-label="Notification Filters">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              filter === 'ALL'
                ? 'border-campus-800 text-campus-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
            aria-current={filter === 'ALL' ? 'page' : undefined}
          >
            <span>All Notifications</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-mono">
              {totalElements}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('UNREAD')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              filter === 'UNREAD'
                ? 'border-campus-800 text-campus-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
            aria-current={filter === 'UNREAD' ? 'page' : undefined}
          >
            <span>Unread Only</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700 font-semibold font-mono">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading notifications">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : notifications.length === 0 ? (
        filter === 'UNREAD' ? (
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8 text-emerald-600" />}
            title="All Caught Up!"
            description="You have no unread notifications. New custody, claim, and reward alerts will appear here."
            action={
              <Button variant="outline" size="sm" onClick={() => setFilter('ALL')}>
                View all notifications
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Bell className="h-8 w-8 text-slate-400" />}
            title="No Notifications Yet"
            description="Your notification center is clean. Alerts about your reported items, lost reports, claims, and reputation rewards will be logged here."
          />
        )
      ) : (
        <div className="space-y-3" role="feed" aria-label="Notifications list">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-xs text-slate-500">
                Page {page + 1} of {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default NotificationsPage;
