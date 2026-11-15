# Notifications, Reminders & Escalations API Specification

## 1. Overview
This document specifies the notification system for CampusFind, implementing GitHub Issue #97 (BACKEND-08).

The notification system comprises:
- **Persistent In-App Notifications:** Real-time visibility into account and item updates (Found items, claims, collections, reputation points).
- **Decoupled Asynchronous / Transactional Event Publishing:** Handlers fire on `TransactionPhase.AFTER_COMMIT`, ensuring notifications and emails only trigger on successful database commits.
- **Email Notification Abstraction with Isolated Resilience:** Failures during immediate email dispatch are logged with retry scheduling and never cause in-app notification creation or business operations to fail or roll back.
- **24-Hour Handover Reminders:** Automated reminders every 24 hours to finders who have reported items but not physically completed handover at a Security Office. Idempotent tracking prevents duplicate cycle reminders.
- **Unclaimed Item Escalation:** Configurable monitoring transitioning items past the threshold from `AVAILABLE` to `UNCLAIMED`, notifying assigned Security Officers and Super Admins. **No automatic disposal, transfer, or ownership assignment is performed.** (Disabled by default: `app.notification.unclaimed-enabled=false`).

---

## 2. Notification Types & Entities

### Notification Types
- `FOUND_ITEM_REPORTED`: Sent to finder upon initial submission.
- `FOUND_ITEM_HANDOVER_CONFIRMED`: Sent to finder when an officer confirms physical custody.
- `HANDOVER_REMINDER`: Sent to finder every 24 hours pending handover.
- `CLAIM_SUBMITTED`: Sent to claimant confirming ownership claim receipt.
- `CLAIM_APPROVED`: Sent to claimant when an officer approves their claim and authorizes collection.
- `CLAIM_REJECTED`: Sent to claimant when an officer rejects their claim with reasons.
- `COLLECTION_CONFIRMED`: Sent to claimant and finder when physical collection is finalized.
- `REPUTATION_AWARDED`: Sent to users earning points for handovers or verified collections.
- `LOST_REPORT_RECOVERED`: Sent to lost report author when an item is collected.
- `UNCLAIMED_ESCALATION`: Sent to Security Officers and Super Admins for administrative review of items exceeding retention threshold.

### Related Entity Types
- `FOUND_ITEM`
- `CLAIM`
- `LOST_REPORT`
- `REPUTATION`

---

## 3. Endpoints

### 3.1. List Authenticated User's Notifications
- **Method:** `GET`
- **Path:** `/api/v1/notifications`
- **Auth:** Required (STUDENT, SECURITY_OFFICER, SUPER_ADMIN)
- **Query Parameters:**
  - `page` (optional, default: 0)
  - `size` (optional, default: 20)
- **Response `200 OK`:**
```json
{
  "content": [
    {
      "id": "e6740c0d-c78d-4cb0-a8dc-917ec7fefcf5",
      "type": "CLAIM_APPROVED",
      "title": "Claim Approved - Ready for Collection",
      "message": "Your ownership claim for 'ThinkPad X1 Laptop' has been approved! Please visit the Central Security Office with your physical Student ID to collect your item.",
      "relatedEntityType": "CLAIM",
      "relatedEntityId": "38a39ec8-a15e-4efb-86ea-1a9e320f7811",
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-11-15T11:00:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 1,
  "totalPages": 1
}
```

### 3.2. Get Unread Notification Count
- **Method:** `GET`
- **Path:** `/api/v1/notifications/unread-count`
- **Auth:** Required
- **Response `200 OK`:**
```json
{
  "unreadCount": 3
}
```

### 3.3. Mark Single Notification as Read
- **Method:** `PATCH`
- **Path:** `/api/v1/notifications/{id}/read`
- **Auth:** Required (Anti-IDOR: Users can only mark their own notifications as read; unauthorized access returns `404 Not Found`).
- **Response `200 OK`:**
```json
{
  "id": "e6740c0d-c78d-4cb0-a8dc-917ec7fefcf5",
  "type": "CLAIM_APPROVED",
  "title": "Claim Approved - Ready for Collection",
  "message": "Your ownership claim for 'ThinkPad X1 Laptop' has been approved! Please visit the Central Security Office with your physical Student ID to collect your item.",
  "relatedEntityType": "CLAIM",
  "relatedEntityId": "38a39ec8-a15e-4efb-86ea-1a9e320f7811",
  "isRead": true,
  "readAt": "2026-11-15T11:05:00Z",
  "createdAt": "2026-11-15T11:00:00Z"
}
```

### 3.4. Mark All Notifications as Read
- **Method:** `PATCH`
- **Path:** `/api/v1/notifications/read-all`
- **Auth:** Required
- **Response `204 No Content`**

---

## 4. Background Schedulers & Configuration

### Properties
Configured in `application.yml`:
```yaml
app:
  notification:
    email-enabled: ${NOTIFICATION_EMAIL_ENABLED:true}
    max-email-retries: ${NOTIFICATION_MAX_EMAIL_RETRIES:3}
    email-retry-delay-seconds: ${NOTIFICATION_EMAIL_RETRY_DELAY_SECONDS:300}
    unclaimed-enabled: ${NOTIFICATION_UNCLAIMED_ENABLED:false}
    unclaimed-threshold-days: ${NOTIFICATION_UNCLAIMED_THRESHOLD_DAYS:30}
    base-url: ${APP_BASE_URL:http://localhost:3000}
  scheduling:
    handover-reminder-cron: "0 0 * * * *"       # Hourly
    unclaimed-escalation-cron: "0 0 2 * * *"    # Daily at 02:00
    email-retry-cron: "0 */5 * * * *"           # Every 5 minutes
```

### Idempotency & Concurrency Safeguards
- `handover_reminder_logs`: Contains a unique composite constraint `(found_item_id, cycle_number)`. Even if the scheduler executes multiple times, only one reminder is dispatched per 24-hour cycle.
- `unclaimed_escalation_logs`: Contains a unique constraint on `found_item_id`. An item is only escalated once.
- `notification_email_deliveries`: Tracks delivery attempts, status transitions (`PENDING` -> `RETRY_SCHEDULED` -> `SENT`/`FAILED`), and next retry timestamps.
