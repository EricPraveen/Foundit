-- V4: Found Items, Image Attachments, and Officer Handover History

-- 1. Create found_items table
CREATE TABLE IF NOT EXISTS found_items (
    id UUID PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    specific_location VARCHAR(255),
    found_at TIMESTAMP WITH TIME ZONE NOT NULL,
    discovered_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    designated_security_office_id UUID NOT NULL REFERENCES security_office(id) ON DELETE RESTRICT,
    handover_status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    availability_status VARCHAR(50) DEFAULT 'UNAVAILABLE' NOT NULL,
    received_by_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    handover_confirmed_at TIMESTAMP WITH TIME ZONE,
    officer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_found_items_handover_status ON found_items(handover_status);
CREATE INDEX IF NOT EXISTS idx_found_items_availability_status ON found_items(availability_status);
CREATE INDEX IF NOT EXISTS idx_found_items_discovered_by ON found_items(discovered_by_user_id);
CREATE INDEX IF NOT EXISTS idx_found_items_office ON found_items(designated_security_office_id);
CREATE INDEX IF NOT EXISTS idx_found_items_category ON found_items(category_id);
CREATE INDEX IF NOT EXISTS idx_found_items_location ON found_items(location_id);
CREATE INDEX IF NOT EXISTS idx_found_items_found_at ON found_items(found_at);
CREATE INDEX IF NOT EXISTS idx_found_items_created_at ON found_items(created_at);

-- 2. Create found_item_images table
CREATE TABLE IF NOT EXISTS found_item_images (
    id UUID PRIMARY KEY,
    found_item_id UUID NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(1000),
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_found_item_images_item_id ON found_item_images(found_item_id);

-- 3. Create found_item_handover_logs table for immutable audit trail
CREATE TABLE IF NOT EXISTS found_item_handover_logs (
    id UUID PRIMARY KEY,
    found_item_id UUID NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
    finder_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    receiving_officer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    security_office_id UUID NOT NULL REFERENCES security_office(id) ON DELETE RESTRICT,
    handover_confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_handover_logs_found_item_id ON found_item_handover_logs(found_item_id);
CREATE INDEX IF NOT EXISTS idx_handover_logs_confirmed_at ON found_item_handover_logs(handover_confirmed_at);
