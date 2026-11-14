-- V5: Lost Reports, Image Attachments, and Lifecycle Audit Logs

-- 1. Create lost_reports table
CREATE TABLE IF NOT EXISTS lost_reports (
    id UUID PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    distinctive_features TEXT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    specific_location VARCHAR(255),
    lost_at TIMESTAMP WITH TIME ZONE NOT NULL,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    designated_security_office_id UUID NOT NULL REFERENCES security_office(id) ON DELETE RESTRICT,
    status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    version BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_lost_report_status CHECK (status IN ('ACTIVE', 'RESOLVED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_lost_reports_student_id ON lost_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_lost_reports_office_id ON lost_reports(designated_security_office_id);
CREATE INDEX IF NOT EXISTS idx_lost_reports_status ON lost_reports(status);
CREATE INDEX IF NOT EXISTS idx_lost_reports_category_id ON lost_reports(category_id);
CREATE INDEX IF NOT EXISTS idx_lost_reports_location_id ON lost_reports(location_id);
CREATE INDEX IF NOT EXISTS idx_lost_reports_lost_at ON lost_reports(lost_at);
CREATE INDEX IF NOT EXISTS idx_lost_reports_created_at ON lost_reports(created_at);

-- 2. Create lost_report_images table
CREATE TABLE IF NOT EXISTS lost_report_images (
    id UUID PRIMARY KEY,
    lost_report_id UUID NOT NULL REFERENCES lost_reports(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(1000),
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lost_report_images_report_id ON lost_report_images(lost_report_id);

-- 3. Create lost_report_audit_logs table
CREATE TABLE IF NOT EXISTS lost_report_audit_logs (
    id UUID PRIMARY KEY,
    lost_report_id UUID NOT NULL REFERENCES lost_reports(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    actor_role VARCHAR(30) NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lost_report_audit_report_id ON lost_report_audit_logs(lost_report_id);
CREATE INDEX IF NOT EXISTS idx_lost_report_audit_created_at ON lost_report_audit_logs(created_at);
