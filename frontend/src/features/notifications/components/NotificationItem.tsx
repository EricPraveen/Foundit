import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Award,
  Sparkles,
  AlertTriangle,
  Check,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import { getNotificationTargetUrl } from '../utils/notificationNavigation';
import { useAuth } from '@/features/auth';
import type { NotificationResponse, NotificationType } from '../types';

interface NotificationItemProps {
  notification: NotificationResponse;
  onMarkAsRead?: (id: string) => Promise<unknown> | void;
  compact?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  compact = false,
}) => {
  const { user } = useAuth();
  const targetUrl = getNotificationTargetUrl(notification, user?.role);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'FOUND_ITEM_REPORTED':
        return <Package className="h-4 w-4 text-amber-600" />;
      case 'FOUND_ITEM_HANDOVER_CONFIRMED':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'HANDOVER_REMINDER':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'CLAIM_SUBMITTED':
        return <FileText className="h-4 w-4 text-sky-600" />;
      case 'CLAIM_APPROVED':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'CLAIM_REJECTED':
        return <XCircle className="h-4 w-4 text-rose-600" />;
      case 'COLLECTION_CONFIRMED':
        return <ShieldCheck className="h-4 w-4 text-teal-600" />;
      case 'REPUTATION_AWARDED':
        return <Award className="h-4 w-4 text-indigo-600" />;
      case 'LOST_REPORT_RECOVERED':
        return <Sparkles className="h-4 w-4 text-emerald-600" />;
      case 'UNCLAIMED_ESCALATION':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4 text-slate-600" />;
    }
  };

  const getIconContainerBg = (type: NotificationType) => {
    switch (type) {
      case 'FOUND_ITEM_REPORTED':
      case 'HANDOVER_REMINDER':
        return 'bg-amber-100';
      case 'FOUND_ITEM_HANDOVER_CONFIRMED':
      case 'CLAIM_APPROVED':
      case 'LOST_REPORT_RECOVERED':
        return 'bg-emerald-100';
      case 'CLAIM_SUBMITTED':
        return 'bg-sky-100';
      case 'CLAIM_REJECTED':
        return 'bg-rose-100';
      case 'COLLECTION_CONFIRMED':
        return 'bg-teal-100';
      case 'REPUTATION_AWARDED':
        return 'bg-indigo-100';
      case 'UNCLAIMED_ESCALATION':
        return 'bg-orange-100';
      default:
        return 'bg-slate-100';
    }
  };

  return (
    <article
      className={`relative rounded-lg border transition-all ${
        notification.isRead
          ? 'bg-white border-slate-200 hover:border-slate-300'
          : 'bg-sky-50/50 border-sky-200 hover:border-sky-300'
      } ${compact ? 'p-3' : 'p-4 sm:p-5'}`}
      aria-label={`${notification.title} - ${notification.isRead ? 'Read' : 'Unread'}`}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getIconContainerBg(
            notification.notificationType
          )}`}
          aria-hidden="true"
        >
          {getNotificationIcon(notification.notificationType)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`text-sm tracking-tight truncate ${
                notification.isRead
                  ? 'font-medium text-slate-900'
                  : 'font-semibold text-slate-950'
              }`}
            >
              {notification.title}
            </h4>

            {/* Read status indicator */}
            {!notification.isRead && (
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-campus-600" title="Unread">
                <span className="sr-only">Unread notification</span>
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
            {notification.message}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100/80">
            <span className="text-[11px] text-slate-400 font-mono">
              {formatDate(notification.createdAt)}
            </span>

            <div className="flex items-center gap-2">
              {/* Target Entity Navigation */}
              {targetUrl && (
                <Link
                  to={targetUrl}
                  className="inline-flex items-center gap-1 text-xs font-medium text-campus-700 hover:text-campus-900 transition-colors"
                >
                  View Details
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}

              {/* Mark as read button */}
              {!notification.isRead && onMarkAsRead && (
                <button
                  type="button"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-1 focus:ring-campus-600"
                  aria-label={`Mark "${notification.title}" as read`}
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                  <span>Mark read</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
