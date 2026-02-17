-- Vendor API Keys Table Schema
-- This table stores license keys with their API key hashes for webhook integration
-- Run this in your Supabase SQL Editor

-- Create vendor_api_keys table
CREATE TABLE IF NOT EXISTS vendor_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES licenses(license_id) ON DELETE CASCADE,
    api_key_hash VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked', 'expired')),
    customer_code VARCHAR(255),
    customer_name VARCHAR(255),
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on api_key_hash for fast lookups (critical for webhook processing)
CREATE INDEX IF NOT EXISTS idx_vendor_api_keys_hash ON vendor_api_keys(api_key_hash);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_vendor_api_keys_status ON vendor_api_keys(status);

-- Create index on license_id for joins
CREATE INDEX IF NOT EXISTS idx_vendor_api_keys_license_id ON vendor_api_keys(license_id);

-- Create index on customer_code for lookups
CREATE INDEX IF NOT EXISTS idx_vendor_api_keys_customer_code ON vendor_api_keys(customer_code);

-- Enable Row Level Security (RLS)
ALTER TABLE vendor_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage vendor_api_keys
DROP POLICY IF EXISTS "Service role can manage vendor_api_keys" ON vendor_api_keys;
CREATE POLICY "Service role can manage vendor_api_keys"
ON vendor_api_keys
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_vendor_api_keys_updated_at ON vendor_api_keys;
CREATE TRIGGER trigger_update_vendor_api_keys_updated_at
    BEFORE UPDATE ON vendor_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_api_keys_updated_at();

-- Function to sync status from licenses table to vendor_api_keys
-- This ensures vendor_api_keys.status stays in sync with licenses.status
CREATE OR REPLACE FUNCTION sync_license_status_to_vendor_api_keys()
RETURNS TRIGGER AS $$
BEGIN
    -- Update vendor_api_keys status when licenses status changes
    UPDATE vendor_api_keys
    SET status = NEW.status,
        updated_at = NOW()
    WHERE license_id = NEW.license_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync status from licenses to vendor_api_keys
DROP TRIGGER IF EXISTS trigger_sync_license_status ON licenses;
CREATE TRIGGER trigger_sync_license_status
    AFTER UPDATE OF status ON licenses
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION sync_license_status_to_vendor_api_keys();

-- Note: You'll need to populate vendor_api_keys table with existing licenses
-- See the migration script or populate it when creating new licenses

