-- Foundit (CampusFind) Foundation Schema Baseline
-- V1: System settings foundation table

CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
    ('app.name', 'Foundit', 'University Lost and Found Application Name'),
    ('app.version', '0.0.1-SNAPSHOT', 'Current Foundation Baseline Version'),
    ('app.university', 'University of Moratuwa', 'Target Institution')
ON CONFLICT (setting_key) DO NOTHING;
