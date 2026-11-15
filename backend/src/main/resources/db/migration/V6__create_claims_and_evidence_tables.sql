-- V6: Claims and Private Ownership Evidence

-- 1. Create claims table
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY,
    found_item_id UUID NOT NULL REFERENCES found_items(id) ON DELETE RESTRICT,
    claimant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    index_number VARCHAR(50) NOT NULL,
    ownership_description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    reviewing_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    review_notes TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    version BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_claim_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'))
);

CREATE INDEX IF NOT EXISTS idx_claims_found_item_id ON claims(found_item_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant_id ON claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_submitted_at ON claims(submitted_at);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);

-- Partial unique index ensuring at most ONE active approved claim exists per found item
CREATE UNIQUE INDEX IF NOT EXISTS uq_found_item_approved_claim ON claims(found_item_id) WHERE status = 'APPROVED';

-- 2. Create claim_evidence table
CREATE TABLE IF NOT EXISTS claim_evidence (
    id UUID PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_evidence_type CHECK (evidence_type IN ('STUDENT_ID_CARD', 'OWNERSHIP_PROOF', 'ADDITIONAL_PROOF'))
);

CREATE INDEX IF NOT EXISTS idx_claim_evidence_claim_id ON claim_evidence(claim_id);
