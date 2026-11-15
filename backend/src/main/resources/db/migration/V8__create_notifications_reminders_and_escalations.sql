-- V8: Notifications, Email Delivery Logs, Handover Reminders, and Unclaimed Escalation

-- 1. Create notifications table (Persistent In-App Notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(60) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_user_id, created_at DESC);

-- 2. Create notification_email_deliveries table (Email Delivery Tracking & Retry Log)
CREATE TABLE IF NOT EXISTS notification_email_deliveries (
    id UUID PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    attempt_count INT DEFAULT 0 NOT NULL,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_status_retry ON notification_email_deliveries(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_notification ON notification_email_deliveries(notification_id);

-- 3. Create handover_reminder_logs table (Idempotent 24h Handover Reminders)
CREATE TABLE IF NOT EXISTS handover_reminder_logs (
    id UUID PRIMARY KEY,
    found_item_id UUID NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cycle_number INT NOT NULL,
    reminded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_handover_reminder_cycle UNIQUE (found_item_id, cycle_number)
);

CREATE INDEX IF NOT EXISTS idx_handover_reminders_item ON handover_reminder_logs(found_item_id, reminded_at);

-- 4. Create unclaimed_escalation_logs table (Idempotent Unclaimed Item Escalations)
CREATE TABLE IF NOT EXISTS unclaimed_escalation_logs (
    id UUID PRIMARY KEY,
    found_item_id UUID NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
    security_office_id UUID NOT NULL REFERENCES security_office(id) ON DELETE CASCADE,
    escalated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    escalation_reason VARCHAR(255) NOT NULL,
    CONSTRAINT uk_unclaimed_escalation_item UNIQUE (found_item_id)
);

CREATE INDEX IF NOT EXISTS idx_unclaimed_escalation_office ON unclaimed_escalation_logs(security_office_id, escalated_at);
