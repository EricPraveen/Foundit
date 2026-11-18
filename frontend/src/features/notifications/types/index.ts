export type NotificationType =
  | 'FOUND_ITEM_REPORTED'
  | 'FOUND_ITEM_HANDOVER_CONFIRMED'
  | 'HANDOVER_REMINDER'
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'COLLECTION_CONFIRMED'
  | 'REPUTATION_AWARDED'
  | 'LOST_REPORT_RECOVERED'
  | 'UNCLAIMED_ESCALATION';

export type NotificationEntityType =
  | 'FOUND_ITEM'
  | 'CLAIM'
  | 'LOST_REPORT'
  | 'REPUTATION';

export interface NotificationResponse {
  id: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  relatedEntityType: NotificationEntityType | null;
  relatedEntityId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
