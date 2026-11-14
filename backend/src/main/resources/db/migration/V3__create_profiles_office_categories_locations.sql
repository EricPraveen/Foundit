-- V3: User profile enhancements, Central Security Office, Categories, and Locations

-- 1. Enhance users table with optional profile fields
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS index_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30),
    ADD COLUMN IF NOT EXISTS index_number_verified BOOLEAN DEFAULT FALSE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_index_number ON users(index_number);

-- 2. Central Security Office
CREATE TABLE IF NOT EXISTS security_office (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    campus_location VARCHAR(200) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    operating_hours VARCHAR(255),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed single Central Security Office baseline (University of Moratuwa)
INSERT INTO security_office (
    id, name, campus_location, contact_email, contact_phone, operating_hours, active
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Central Security Office',
    'Main Administrative Complex, University of Moratuwa',
    'security@uom.lk',
    '+94 11 265 0301',
    '24/7 Custody and Handover Desk',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 3. Security Officer Profiles (linking officers to the Central Security Office)
CREATE TABLE IF NOT EXISTS security_officer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    security_office_id UUID NOT NULL REFERENCES security_office(id) ON DELETE RESTRICT,
    badge_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_categories_name UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_categories_active_name ON categories(active, name);

-- Seed foundational categories
INSERT INTO categories (id, name, description, active) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Electronics & Accessories', 'Phones, laptops, chargers, headphones, calculators, USB drives', TRUE),
    ('b0000000-0000-0000-0000-000000000002', 'Identity Cards & Documents', 'University Student IDs, NICs, driver licenses, passports, bank cards', TRUE),
    ('b0000000-0000-0000-0000-000000000003', 'Wallets, Purses & Money', 'Wallets, purses, pouches, cash envelopes', TRUE),
    ('b0000000-0000-0000-0000-000000000004', 'Keys & Smart Fobs', 'Room keys, vehicle keys, padlock keys, smart key fobs', TRUE),
    ('b0000000-0000-0000-0000-000000000005', 'Bags & Luggage', 'Backpacks, laptop sleeves, tote bags, hand luggage', TRUE),
    ('b0000000-0000-0000-0000-000000000006', 'Books & Stationery', 'Textbooks, lecture note files, pencil cases, scientific calculators', TRUE),
    ('b0000000-0000-0000-0000-000000000007', 'Clothing & Personal Items', 'Umbrellas, jackets, spectacles, water bottles, wristwatches', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 5. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    campus_zone VARCHAR(100),
    description TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_locations_name UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_locations_active_name ON locations(active, name);

-- Seed foundational University of Moratuwa reference locations
INSERT INTO locations (id, name, campus_zone, description, active) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Central Library', 'Academic Zone', 'Main university library and study halls', TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'Main Canteen', 'Student Services', 'Ground floor central dining hall', TRUE),
    ('c0000000-0000-0000-0000-000000000003', 'Central Security Office', 'Administration', 'Main security counter and physical custody desk', TRUE),
    ('c0000000-0000-0000-0000-000000000004', 'Gymnasium & Sports Grounds', 'Recreation Zone', 'Indoor sports complex and pavilion grounds', TRUE),
    ('c0000000-0000-0000-0000-000000000005', 'Civil Engineering Complex', 'Engineering Faculty', 'Civil engineering lecture theaters and labs', TRUE),
    ('c0000000-0000-0000-0000-000000000006', 'Electrical & Electronic Building', 'Engineering Faculty', 'ENTC and Electrical labs and lecture halls', TRUE),
    ('c0000000-0000-0000-0000-000000000007', 'Information Technology Building', 'IT Faculty', 'Faculty of Information Technology halls', TRUE)
ON CONFLICT (name) DO NOTHING;
