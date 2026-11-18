import type { NotificationResponse } from '../types';

export function getNotificationTargetUrl(
  notification: NotificationResponse,
  userRole?: string
): string | null {
  const { relatedEntityType, relatedEntityId, notificationType } = notification;

  if (notificationType === 'UNCLAIMED_ESCALATION') {
    if (userRole === 'SUPER_ADMIN') {
      return '/admin/unclaimed-policy';
    }
    if (userRole === 'SECURITY_OFFICER') {
      return '/officer/found-items';
    }
  }

  if (relatedEntityType === 'REPUTATION') {
    return '/profile';
  }

  if (!relatedEntityId) {
    return null;
  }

  if (relatedEntityType === 'FOUND_ITEM') {
    if (userRole === 'SECURITY_OFFICER') {
      if (
        notificationType === 'FOUND_ITEM_REPORTED' ||
        notificationType === 'HANDOVER_REMINDER'
      ) {
        return `/officer/handovers/${relatedEntityId}`;
      }
      return `/officer/found-items`;
    }
    return `/items/${relatedEntityId}`;
  }

  if (relatedEntityType === 'CLAIM') {
    if (userRole === 'SECURITY_OFFICER') {
      return `/officer/claims/${relatedEntityId}`;
    }
    return `/claims/${relatedEntityId}`;
  }

  if (relatedEntityType === 'LOST_REPORT') {
    if (userRole === 'SECURITY_OFFICER') {
      return `/officer/lost-reports/${relatedEntityId}`;
    }
    return `/lost-reports/${relatedEntityId}`;
  }

  return null;
}
