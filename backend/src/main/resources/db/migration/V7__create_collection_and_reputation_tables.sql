-- V7: Collection Logs, Reputation Transactions Ledger, and Category Point Rules

-- 1. Create category_reputation_rules table
CREATE TABLE IF NOT EXISTS category_reputation_rules (
    id UUID PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    points INT NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_category_rep_rule UNIQUE (category_id, transaction_type),
    CONSTRAINT chk_rule_transaction_type CHECK (transaction_type IN ('FOUND_ITEM_HANDOVER', 'ITEM_COLLECTION', 'ADMIN_ADJUSTMENT'))
);

CREATE INDEX IF NOT EXISTS idx_cat_rep_rules_category ON category_reputation_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_cat_rep_rules_active ON category_reputation_rules(active);

-- Seed baseline category point rules for University of Moratuwa categories
-- Configurable values; can be adjusted without code modifications
INSERT INTO category_reputation_rules (id, category_id, transaction_type, points, active) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'FOUND_ITEM_HANDOVER', 15, TRUE),
    ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'ITEM_COLLECTION', 5, TRUE),
    ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'FOUND_ITEM_HANDOVER', 20, TRUE),
    ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'ITEM_COLLECTION', 5, TRUE),
    ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'FOUND_ITEM_HANDOVER', 15, TRUE),
    ('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'ITEM_COLLECTION', 5, TRUE),
    ('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000004', 'FOUND_ITEM_HANDOVER', 10, TRUE),
    ('d0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', 'ITEM_COLLECTION', 5, TRUE),
    ('d0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000005', 'FOUND_ITEM_HANDOVER', 10, TRUE),
    ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000005', 'ITEM_COLLECTION', 5, TRUE),
    ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000006', 'FOUND_ITEM_HANDOVER', 10, TRUE),
    ('d0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000006', 'ITEM_COLLECTION', 5, TRUE),
    ('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000007', 'FOUND_ITEM_HANDOVER', 10, TRUE),
    ('d0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000007', 'ITEM_COLLECTION', 5, TRUE)
ON CONFLICT (category_id, transaction_type) DO NOTHING;

-- 2. Create reputation_transactions table (Append-only Ledger)
CREATE TABLE IF NOT EXISTS reputation_transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id UUID NOT NULL,
    idempotency_key VARCHAR(150) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_reputation_tx_type CHECK (transaction_type IN ('FOUND_ITEM_HANDOVER', 'ITEM_COLLECTION', 'ADMIN_ADJUSTMENT')),
    CONSTRAINT chk_reputation_source_type CHECK (source_type IN ('FOUND_ITEM', 'CLAIM'))
);

CREATE INDEX IF NOT EXISTS idx_reputation_tx_user_created ON reputation_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_tx_source ON reputation_transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_reputation_tx_idempotency ON reputation_transactions(idempotency_key);

-- 3. Create item_collection_logs table (Physical collection audit log)
CREATE TABLE IF NOT EXISTS item_collection_logs (
    id UUID PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    found_item_id UUID NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    security_office_id UUID NOT NULL REFERENCES security_office(id) ON DELETE CASCADE,
    collection_status VARCHAR(50) DEFAULT 'COMPLETED' NOT NULL,
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    officer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_collection_claim UNIQUE (claim_id),
    CONSTRAINT uk_collection_found_item UNIQUE (found_item_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_logs_claim ON item_collection_logs(claim_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_item ON item_collection_logs(found_item_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_claimant ON item_collection_logs(claimant_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_officer ON item_collection_logs(officer_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_collected_at ON item_collection_logs(collected_at);

-- 4. Update lost_reports status check constraint to include 'RECOVERED'
ALTER TABLE lost_reports DROP CONSTRAINT IF EXISTS chk_lost_report_status;
ALTER TABLE lost_reports ADD CONSTRAINT chk_lost_report_status CHECK (status IN ('ACTIVE', 'RESOLVED', 'CANCELLED', 'RECOVERED'));
