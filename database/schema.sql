-- License Management System Database Schema
-- Run this in your Supabase SQL Editor

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
    license_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
    signature_hash VARCHAR(255),
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_licenses_customer_id ON licenses(customer_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

-- Create index on expires_at for expiration queries
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to do everything
-- Note: In production, you should create more restrictive policies
CREATE POLICY "Service role can manage licenses"
ON licenses
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

